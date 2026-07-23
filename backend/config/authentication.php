<?php

declare(strict_types=1);

return [
    'token_name' => env('SANCTUM_TOKEN_NAME', 'stms-api-token'),
    'token_expiration_minutes' => (int) env('SANCTUM_TOKEN_EXPIRATION', 1440),
    // Frontend page that consumes the reset token. Falls back to the frontend
    // origin (FRONTEND_URL) + /reset-password when not set explicitly.
    'password_reset_url' => env('PASSWORD_RESET_URL') ?: rtrim((string) env('FRONTEND_URL', ''), '/').'/reset-password',

    // ----- Email verification (Resend integration) -----
    // Signed verification links expire after this many minutes.
    'email_verification_expire_minutes' => (int) env('EMAIL_VERIFICATION_EXPIRE_MINUTES', 60 * 24),
    // When true, unverified customers are blocked from creating bookings.
    // Default false so existing accounts and flows are never broken by the
    // integration; enable once the mailer is confirmed working in production.
    'require_email_verification' => (bool) env('EMAIL_VERIFICATION_REQUIRED', true),
    // Landing page after a verification link is clicked.
    'email_verified_redirect' => env('EMAIL_VERIFIED_REDIRECT') ?: rtrim((string) env('FRONTEND_URL', ''), '/').'/login?verified=1',
];
