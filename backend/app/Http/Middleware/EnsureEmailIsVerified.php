<?php

declare(strict_types=1);

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * Optional verification gate (EMAIL_VERIFICATION_REQUIRED, default false).
 * Applied to protected features (booking creation); existing users are
 * grandfathered as verified by the migration, so enabling the flag can never
 * lock out current accounts.
 */
final class EnsureEmailIsVerified
{
    public function handle(Request $request, Closure $next): Response
    {
        if (! (bool) config('authentication.require_email_verification')) {
            return $next($request);
        }
        $user = $request->user();
        if ($user !== null && $user->email_verified_at === null) {
            abort(409, 'Verifikasi email Anda terlebih dahulu. Cek kotak masuk atau kirim ulang email verifikasi dari profil Anda.');
        }
        return $next($request);
    }
}
