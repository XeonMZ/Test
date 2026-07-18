<?php

declare(strict_types=1);

return [
    'token_name' => env('SANCTUM_TOKEN_NAME', 'stms-api-token'),
    'token_expiration_minutes' => (int) env('SANCTUM_TOKEN_EXPIRATION', 1440),
    // Frontend page that consumes the reset token. Falls back to the frontend
    // origin (FRONTEND_URL) + /reset-password when not set explicitly.
    'password_reset_url' => env('PASSWORD_RESET_URL') ?: rtrim((string) env('FRONTEND_URL', ''), '/').'/reset-password',
];
