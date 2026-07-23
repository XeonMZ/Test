<?php

declare(strict_types=1);

namespace App\Support\Auth;

use App\Models\ActivityLog;
use App\Models\OtpCode;
use App\Models\User;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

/**
 * Issues and verifies one-time passcodes.
 *
 * Threat model and the mitigation for each:
 *
 *  | Threat                          | Mitigation                                    |
 *  |---------------------------------|-----------------------------------------------|
 *  | Offline brute force after a DB  | HMAC-SHA256 keyed with APP_KEY. The digits are |
 *  | leak (10^6 keyspace)            | never stored; the key is not in the database.  |
 *  | Online guessing                 | MAX_ATTEMPTS per code + route throttles.       |
 *  | Replay                          | Single-use `consumed_at`, checked under lock.  |
 *  | Cross-purpose replay            | Purpose + email are HMAC-bound into the hash.  |
 *  | Parallel-request race           | `lockForUpdate()` inside a transaction.        |
 *  | Timing oracle                   | `hash_equals` on every comparison.             |
 *  | Account enumeration             | Callers return one generic message either way. |
 *  | Mailbox flooding                | RESEND_COOLDOWN_SECONDS between issues.        |
 *  | Predictable codes               | `random_int` (CSPRNG), never `rand`/`mt_rand`. |
 *
 * Note the deliberate asymmetry: `issue()` is silent about whether the address
 * belongs to a real account, and `verify()` returns one indistinguishable
 * error for wrong/expired/consumed/exhausted. Callers MUST NOT unpack these
 * into more specific messages — that would hand an attacker an oracle.
 */
final class OtpService
{
    public const PURPOSE_EMAIL_VERIFICATION = 'email_verification';
    public const PURPOSE_PASSWORD_RESET = 'password_reset';

    /** Wrong guesses tolerated per code before it is burned. */
    private const MAX_ATTEMPTS = 5;

    /** Validity window. Short enough to limit interception, long enough to paste. */
    private const TTL_MINUTES = 10;

    /** Minimum gap between two issues for the same email + purpose. */
    private const RESEND_COOLDOWN_SECONDS = 60;

    private const DIGITS = 6;

    /**
     * Mint a passcode. The plaintext is returned exactly once, for the mailer —
     * it is never persisted, logged, or exposed through any API response.
     *
     * @return array{code: string, expires_at: Carbon}
     */
    public function issue(string $email, string $purpose, ?User $user, ?string $ip = null, ?string $userAgent = null): array
    {
        $email = $this->normalise($email);
        $this->assertPurpose($purpose);

        return DB::transaction(function () use ($email, $purpose, $user, $ip, $userAgent): array {
            $this->guardCooldown($email, $purpose);

            // Supersede every outstanding code: a user who requests a new one
            // must not leave older still-valid codes floating in old emails.
            OtpCode::query()
                ->where('email', $email)
                ->where('purpose', $purpose)
                ->whereNull('consumed_at')
                ->update(['consumed_at' => now(), 'updated_at' => now()]);

            // CSPRNG. Zero-padded so every code is exactly DIGITS long and
            // low values are not shorter (which would leak entropy).
            $code = str_pad((string) random_int(0, (10 ** self::DIGITS) - 1), self::DIGITS, '0', STR_PAD_LEFT);
            $expiresAt = now()->addMinutes(self::TTL_MINUTES);

            OtpCode::create([
                'user_id' => $user?->getKey(),
                'email' => $email,
                'purpose' => $purpose,
                'code_hash' => $this->hash($code, $email, $purpose),
                'expires_at' => $expiresAt,
                'request_ip' => $ip,
                'user_agent' => $userAgent === null ? null : mb_substr($userAgent, 0, 255),
            ]);

            ActivityLog::create([
                'action' => 'auth.otp_issued',
                'subject_type' => 'User',
                'subject_id' => $user?->getKey(),
                // Deliberately no code, no hash.
                'metadata' => ['email' => $email, 'purpose' => $purpose, 'ip' => $ip],
            ]);

            return ['code' => $code, 'expires_at' => $expiresAt];
        });
    }

    /**
     * Consume a passcode. Returns the row on success; throws an intentionally
     * vague ValidationException on every failure mode.
     */
    public function verify(string $email, string $purpose, string $code, ?string $ip = null): OtpCode
    {
        $email = $this->normalise($email);
        $this->assertPurpose($purpose);
        $code = trim($code);

        return DB::transaction(function () use ($email, $purpose, $code, $ip): OtpCode {
            /** @var OtpCode|null $otp */
            $otp = OtpCode::query()
                ->where('email', $email)
                ->where('purpose', $purpose)
                ->whereNull('consumed_at')
                ->orderByDesc('id')
                // Serialises concurrent guesses so `attempts` cannot be
                // outrun by firing requests in parallel.
                ->lockForUpdate()
                ->first();

            if ($otp === null || $otp->isExpired() || $otp->attempts >= self::MAX_ATTEMPTS) {
                $this->logFailure($email, $purpose, $ip, 'no_active_code');
                $this->fail();
            }

            if (! hash_equals($otp->code_hash, $this->hash($code, $email, $purpose))) {
                $otp->increment('attempts');

                // Burn the code the moment the ceiling is reached, so the
                // attacker must trigger a new email (and hit the cooldown +
                // route throttle) for every further batch of guesses.
                if ($otp->attempts >= self::MAX_ATTEMPTS) {
                    $otp->forceFill(['consumed_at' => now()])->save();
                }

                $this->logFailure($email, $purpose, $ip, 'mismatch');
                $this->fail();
            }

            $otp->forceFill(['consumed_at' => now()])->save();

            ActivityLog::create([
                'action' => 'auth.otp_verified',
                'subject_type' => 'User',
                'subject_id' => $otp->user_id,
                'metadata' => ['email' => $email, 'purpose' => $purpose, 'ip' => $ip],
            ]);

            return $otp;
        });
    }

    /** Invalidate everything outstanding — used after a successful password reset. */
    public function revokeAll(string $email, ?string $purpose = null): void
    {
        $query = OtpCode::query()
            ->where('email', $this->normalise($email))
            ->whereNull('consumed_at');

        if ($purpose !== null) {
            $query->where('purpose', $purpose);
        }

        $query->update(['consumed_at' => now(), 'updated_at' => now()]);
    }

    public function ttlMinutes(): int
    {
        return self::TTL_MINUTES;
    }

    /**
     * Keyed digest. Binding email+purpose into the message means a hash is
     * only ever valid for the exact address and flow it was minted for.
     */
    private function hash(string $code, string $email, string $purpose): string
    {
        return hash_hmac('sha256', $purpose.'|'.$email.'|'.$code, $this->secret());
    }

    /** Raw application secret; APP_KEY is base64-wrapped by Laravel. */
    private function secret(): string
    {
        $key = (string) config('app.key');

        if (str_starts_with($key, 'base64:')) {
            $decoded = base64_decode(substr($key, 7), true);
            if ($decoded !== false) {
                return $decoded;
            }
        }

        if ($key === '') {
            // Refuse to mint guessable codes rather than degrade silently.
            throw new \RuntimeException('APP_KEY is not set; OTP hashing cannot be keyed securely.');
        }

        return $key;
    }

    private function guardCooldown(string $email, string $purpose): void
    {
        $recent = OtpCode::query()
            ->where('email', $email)
            ->where('purpose', $purpose)
            ->where('created_at', '>', now()->subSeconds(self::RESEND_COOLDOWN_SECONDS))
            ->exists();

        if ($recent) {
            throw ValidationException::withMessages([
                'email' => ['Kode baru saja dikirim. Tunggu sebentar sebelum meminta kode lagi.'],
            ]);
        }
    }

    private function logFailure(string $email, string $purpose, ?string $ip, string $reason): void
    {
        ActivityLog::create([
            'action' => 'auth.otp_failed',
            'subject_type' => 'User',
            'subject_id' => null,
            'metadata' => ['email' => $email, 'purpose' => $purpose, 'ip' => $ip, 'reason' => $reason],
        ]);
    }

    /** One message for every failure mode — see the class docblock. */
    private function fail(): never
    {
        throw ValidationException::withMessages([
            'code' => ['Kode verifikasi salah atau sudah kedaluwarsa. Minta kode baru bila perlu.'],
        ]);
    }

    private function assertPurpose(string $purpose): void
    {
        if (! in_array($purpose, [self::PURPOSE_EMAIL_VERIFICATION, self::PURPOSE_PASSWORD_RESET], true)) {
            throw new \InvalidArgumentException("Unknown OTP purpose [{$purpose}].");
        }
    }

    private function normalise(string $email): string
    {
        return mb_strtolower(trim($email));
    }
}
