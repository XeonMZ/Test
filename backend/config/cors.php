<?php

declare(strict_types=1);

/*
 * CORS configuration — fully environment-driven, no hosting provider baked in.
 *
 * Set the deployed frontend origin(s) in the backend environment:
 *   FRONTEND_URL=https://app.example.com
 *   CORS_ALLOWED_ORIGINS=https://staging.example.com,https://admin.example.com
 *
 * Optional regex patterns (comma-separated) for wildcard subdomains:
 *   CORS_ALLOWED_ORIGIN_PATTERNS=#^https://.*\.example\.com$#
 */

$fromEnv = array_filter(array_map('trim', explode(',', (string) env('CORS_ALLOWED_ORIGINS', ''))));
$frontend = trim((string) env('FRONTEND_URL', ''));
$isProduction = env('APP_ENV') === 'production';

$allowedOrigins = array_values(array_unique(array_filter([
    $frontend !== '' ? $frontend : null,
    ...$fromEnv,
    // Local development defaults (never added in production).
    $isProduction ? null : 'http://localhost:3000',
    $isProduction ? null : 'http://127.0.0.1:3000',
])));

$patterns = array_filter(array_map('trim', explode(',', (string) env('CORS_ALLOWED_ORIGIN_PATTERNS', ''))));

return [
    'paths' => ['api/*', 'sanctum/csrf-cookie', 'broadcasting/auth'],

    'allowed_methods' => ['*'],

    // Exact origins listed above. CORS_ALLOW_ALL=true opens every origin and
    // must never be enabled in production.
    'allowed_origins' => env('CORS_ALLOW_ALL', false) ? ['*'] : $allowedOrigins,

    'allowed_origins_patterns' => array_values($patterns),

    'allowed_headers' => ['*'],

    'exposed_headers' => [],

    'max_age' => 0,

    // Token-based auth (Sanctum bearer tokens) does not require credentialed
    // cookies, but leaving this true is safe and needed if you use SPA cookies.
    'supports_credentials' => true,
];
