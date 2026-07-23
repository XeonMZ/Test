<?php

declare(strict_types=1);

namespace App\Modules\Auth\Application\Services;

use App\Events\PasswordChanged;
use App\Mail\OtpMail;
use App\Models\ActivityLog;
use App\Models\User;
use App\Support\Auth\OtpService;
use App\Support\Mail\TransactionalMailer;
use Illuminate\Auth\Events\PasswordReset;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

/**
 * Password reset by one-time passcode.
 *
 * The previous implementation answered "Email tidak terdaftar." on unknown
 * addresses, which turns this endpoint into a free account-enumeration oracle:
 * anyone could confirm whether a given person has an account here just by
 * watching the response. Every path now returns one identical message, and the
 * only observable difference is whether an email lands in a mailbox the caller
 * already controls.
 *
 * Keeping that property is subtle — see the cooldown handling in forgot().
 */
final class PasswordService
{
    public function __construct(
        private readonly OtpService $otp,
        private readonly TransactionalMailer $mailer,
    ) {}

    /** Uniform reply for every branch, so nothing distinguishes the cases. */
    private const GENERIC_REPLY = 'Jika email tersebut terdaftar, kami telah mengirimkan kode verifikasi. Periksa kotak masuk dan folder spam Anda.';

    private const GENERIC_OTP_ERROR = 'Kode verifikasi salah atau sudah kedaluwarsa. Minta kode baru bila perlu.';

    public function forgot(array $data, ?string $ip = null, ?string $userAgent = null): string
    {
        $email = mb_strtolower(trim((string) $data['email']));
        $user = User::where('email', $email)->first();

        if ($user === null) {
            ActivityLog::create([
                'action' => 'auth.password_reset_unknown_email',
                'subject_type' => 'User',
                'subject_id' => null,
                'metadata' => ['email' => $email, 'ip' => $ip],
            ]);

            return self::GENERIC_REPLY;
        }

        try {
            $issued = $this->otp->issue($email, OtpService::PURPOSE_PASSWORD_RESET, $user, $ip, $userAgent);
        } catch (ValidationException) {
            // The resend cooldown fired. Surfacing that would reveal the
            // address exists — only a known account can be in cooldown.
            // Swallow it and answer exactly as we would for a stranger; the
            // caller simply gets no second email.
            return self::GENERIC_REPLY;
        }

        $this->mailer->queue(
            'reset_password',
            $email,
            'Kode Reset Password Anda - SJT Travel',
            new OtpMail(
                recipientName: (string) $user->name,
                toAddress: $email,
                code: $issued['code'],
                purpose: OtpService::PURPOSE_PASSWORD_RESET,
                expireMinutes: $this->otp->ttlMinutes(),
                requestIp: $ip,
                requestedAt: now()->translatedFormat('d F Y, H:i').' WIB',
            ),
            // Rotates per issued code, so a genuine re-request is never
            // swallowed by the mailer's duplicate suppression.
            "user:{$user->getKey()}:reset:".now()->format('YmdHis'),
            (int) $user->getKey(),
        );

        return self::GENERIC_REPLY;
    }

    public function reset(array $data, ?string $ip = null): string
    {
        $email = mb_strtolower(trim((string) $data['email']));

        // Throws the deliberately vague OTP error on any failure mode.
        $this->otp->verify($email, OtpService::PURPOSE_PASSWORD_RESET, (string) $data['code'], $ip);

        $user = User::where('email', $email)->first();
        if ($user === null) {
            // Only reachable if the account vanished between issue and
            // redeem; treat it as a failed code rather than explaining.
            throw ValidationException::withMessages(['code' => [self::GENERIC_OTP_ERROR]]);
        }

        $user->forceFill([
            'password' => Hash::make((string) $data['password']),
            'remember_token' => Str::random(60),
        ])->save();

        // Anyone holding a session on this account loses it — that is the
        // point of a reset when the account may already be compromised.
        $user->tokens()->delete();

        // Nothing outstanding should survive a completed reset, including any
        // pending verification code for the same mailbox.
        $this->otp->revokeAll($email);

        event(new PasswordReset($user));
        PasswordChanged::dispatch($user, ['reset' => true]);

        ActivityLog::create([
            'action' => 'auth.password_reset',
            'subject_type' => 'User',
            'subject_id' => $user->getKey(),
            'metadata' => ['email' => $email, 'ip' => $ip],
        ]);

        return 'Password berhasil diubah. Silakan masuk dengan password baru Anda.';
    }

    public function change(User $user, string $password): void
    {
        $user->forceFill(['password' => Hash::make($password)])->save();
        $user->tokens()->where('id', '!=', $user->currentAccessToken()?->id)->delete();
        PasswordChanged::dispatch($user, ['reset' => false]);
    }
}
