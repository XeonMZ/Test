<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use App\Mail\VerifyEmailMail;
use App\Models\ActivityLog;
use App\Models\User;
use App\Support\Mail\TransactionalMailer;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\URL;

/**
 * Email verification for the existing (token/SPA) auth flow.
 *
 *  - verify(): target of the temporary SIGNED url in the email. The signature
 *    covers id + sha1(email) + expiry → tamper-proof; marking is idempotent
 *    (already-verified links simply redirect), which also neutralises replay.
 *  - resend(): authenticated + throttled; dedupe key rotates hourly so a user
 *    gets at most one queued verification email per hour per address.
 */
final class EmailVerificationController extends Controller
{
    public function __construct(private readonly TransactionalMailer $mailer) {}

    public static function signedUrlFor(User $user): string
    {
        return URL::temporarySignedRoute(
            'verification.verify',
            now()->addMinutes((int) config('authentication.email_verification_expire_minutes')),
            ['id' => $user->getKey(), 'hash' => sha1((string) $user->email)],
        );
    }

    public static function queueFor(User $user, TransactionalMailer $mailer, string $dedupeSuffix): bool
    {
        return $mailer->queue(
            'verify_email',
            (string) $user->email,
            'Verify Your Email - SJT Travel',
            new VerifyEmailMail($user, self::signedUrlFor($user), (int) config('authentication.email_verification_expire_minutes')),
            "user:{$user->getKey()}:{$dedupeSuffix}",
            (int) $user->getKey(),
        );
    }

    /** GET /email/verify/{id}/{hash} — middleware('signed') validates URL integrity + expiry. */
    public function verify(Request $request, string $id, string $hash): RedirectResponse
    {
        $user = User::findOrFail($id);
        abort_unless(hash_equals(sha1((string) $user->email), $hash), 403, 'Tautan verifikasi tidak valid.');

        if ($user->email_verified_at === null) {
            $user->forceFill(['email_verified_at' => now()])->save();
            ActivityLog::create(['action' => 'auth.email_verified', 'subject_type' => 'User', 'subject_id' => $user->id, 'metadata' => ['email' => $user->email, 'ip' => $request->ip()]]);
        }

        return redirect()->away((string) config('authentication.email_verified_redirect'));
    }

    /** POST /email/verification-notification — resend (auth + throttle). */
    public function resend(Request $request): JsonResponse
    {
        $user = $request->user();
        if ($user->email_verified_at !== null) {
            return response()->json(['success' => true, 'message' => 'Email Anda sudah terverifikasi.', 'data' => ['verified' => true]]);
        }

        $queued = self::queueFor($user, $this->mailer, 'resend:'.now()->format('YmdH'));
        ActivityLog::create(['action' => 'auth.verification_resent', 'subject_type' => 'User', 'subject_id' => $user->id, 'metadata' => ['email' => $user->email, 'queued' => $queued]]);

        return response()->json(['success' => true, 'message' => $queued ? 'Email verifikasi telah dikirim ulang. Periksa kotak masuk Anda.' : 'Email verifikasi baru saja dikirim — periksa kotak masuk/spam, atau coba lagi dalam satu jam.', 'data' => ['verified' => false]]);
    }
}
