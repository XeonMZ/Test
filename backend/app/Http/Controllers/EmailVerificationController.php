<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use App\Http\Requests\VerifyOtpRequest;
use App\Mail\OtpMail;
use App\Models\ActivityLog;
use App\Models\User;
use App\Support\Auth\OtpService;
use App\Support\Mail\TransactionalMailer;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;

/**
 * Email verification by one-time passcode.
 *
 *  - send():   authenticated + throttled; mints a fresh code and emails it.
 *  - confirm(): authenticated + throttled; redeems the code and marks the
 *               address verified. Idempotent for already-verified accounts.
 *  - verify():  the legacy signed-link target, kept so codes-by-link already
 *               sitting in inboxes when this shipped still work. It performs
 *               no state change beyond the same idempotent marking.
 */
final class EmailVerificationController extends Controller
{
    public function __construct(
        private readonly TransactionalMailer $mailer,
        private readonly OtpService $otp,
    ) {}

    /**
     * Mint + queue a verification passcode. Shared with the post-registration
     * listener so both entry points behave identically.
     */
    public static function queueFor(User $user, TransactionalMailer $mailer, OtpService $otp, string $dedupeSuffix, ?string $ip = null, ?string $userAgent = null): bool
    {
        $email = mb_strtolower(trim((string) $user->email));

        try {
            $issued = $otp->issue($email, OtpService::PURPOSE_EMAIL_VERIFICATION, $user, $ip, $userAgent);
        } catch (ValidationException) {
            // Cooldown: a code sent moments ago is still valid, so there is
            // nothing to do and nothing to apologise for.
            return false;
        }

        return $mailer->queue(
            'verify_email',
            $email,
            'Kode Verifikasi Email Anda - SJT Travel',
            new OtpMail(
                recipientName: (string) $user->name,
                toAddress: $email,
                code: $issued['code'],
                purpose: OtpService::PURPOSE_EMAIL_VERIFICATION,
                expireMinutes: $otp->ttlMinutes(),
                requestIp: $ip,
                requestedAt: now()->translatedFormat('d F Y, H:i').' WIB',
            ),
            "user:{$user->getKey()}:{$dedupeSuffix}:".now()->format('YmdHis'),
            (int) $user->getKey(),
        );
    }

    /** POST /email/verification-notification */
    public function send(Request $request): JsonResponse
    {
        $user = $request->user();

        if ($user->email_verified_at !== null) {
            return response()->json(['success' => true, 'message' => 'Email Anda sudah terverifikasi.', 'data' => ['verified' => true]]);
        }

        $queued = self::queueFor($user, $this->mailer, $this->otp, 'resend', $request->ip(), $request->userAgent());

        ActivityLog::create([
            'action' => 'auth.verification_code_sent',
            'subject_type' => 'User',
            'subject_id' => $user->getKey(),
            'metadata' => ['email' => $user->email, 'queued' => $queued, 'ip' => $request->ip()],
        ]);

        return response()->json([
            'success' => true,
            'message' => $queued
                ? 'Kode verifikasi telah dikirim. Periksa kotak masuk dan folder spam Anda.'
                : 'Kode verifikasi baru saja dikirim — periksa kotak masuk Anda, atau coba lagi dalam satu menit.',
            'data' => ['verified' => false, 'expires_in_minutes' => $this->otp->ttlMinutes()],
        ]);
    }

    /** POST /email/verify-otp */
    public function confirm(VerifyOtpRequest $request): JsonResponse
    {
        $user = $request->user();

        if ($user->email_verified_at !== null) {
            return response()->json(['success' => true, 'message' => 'Email Anda sudah terverifikasi.', 'data' => ['verified' => true]]);
        }

        // The code is bound to this account's own address, so a code minted
        // for someone else can never verify this account.
        $this->otp->verify(
            (string) $user->email,
            OtpService::PURPOSE_EMAIL_VERIFICATION,
            (string) $request->validated('code'),
            $request->ip(),
        );

        $user->forceFill(['email_verified_at' => now()])->save();

        ActivityLog::create([
            'action' => 'auth.email_verified',
            'subject_type' => 'User',
            'subject_id' => $user->getKey(),
            'metadata' => ['email' => $user->email, 'ip' => $request->ip(), 'method' => 'otp'],
        ]);

        return response()->json(['success' => true, 'message' => 'Email berhasil diverifikasi.', 'data' => ['verified' => true]]);
    }

    /**
     * GET /email/verify/{id}/{hash} — legacy signed link. Retained only so
     * links already delivered before the OTP rollout keep working; nothing
     * issues new ones. Safe to delete once those have expired.
     */
    public function verify(Request $request, string $id, string $hash): RedirectResponse
    {
        $user = User::findOrFail($id);
        abort_unless(hash_equals(sha1((string) $user->email), $hash), 403, 'Tautan verifikasi tidak valid.');

        if ($user->email_verified_at === null) {
            $user->forceFill(['email_verified_at' => now()])->save();
            ActivityLog::create([
                'action' => 'auth.email_verified',
                'subject_type' => 'User',
                'subject_id' => $user->id,
                'metadata' => ['email' => $user->email, 'ip' => $request->ip(), 'method' => 'signed_link'],
            ]);
        }

        return redirect()->away((string) config('authentication.email_verified_redirect'));
    }
}
