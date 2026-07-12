<?php

declare(strict_types=1);

/*
 * CORS configuration.
 *
 * The frontend runs on a different domain (e.g. *.up.railway.app), so the API
 * must explicitly allow that origin. Set FRONTEND_URL in the backend's
 * environment to your deployed frontend URL, e.g.:
 *   FRONTEND_URL=https://just-connection-df85.up.railway.app
 *
 * Multiple origins can be comma-separated in CORS_ALLOWED_ORIGINS.
 */

$fromEnv = array_filter(array_map('trim', explode(',', (string) env('CORS_ALLOWED_ORIGINS', ''))));
$frontend = trim((string) env('FRONTEND_URL', ''));

$allowedOrigins = array_values(array_unique(array_filter([
    $frontend !== '' ? $frontend : null,
    ...$fromEnv,
    // Local development defaults.
    'http://localhost:3000',
    'http://127.0.0.1:3000',
])));

return [
    'paths' => ['api/*', 'sanctum/csrf-cookie', 'broadcasting/auth'],

    'allowed_methods' => ['*'],

    // Exact origins listed above. If none configured beyond localhost, you can
    // temporarily allow all with CORS_ALLOW_ALL=true (NOT recommended in prod).
    'allowed_origins' => env('CORS_ALLOW_ALL', false) ? ['*'] : $allowedOrigins,

    'allowed_origins_patterns' => array_filter([
        // Allow any Railway subdomain for this project by default.
        env('CORS_ALLOW_RAILWAY', true) ? '#^https://.*\.up\.railway\.app$#' : null,
    ]),

    'allowed_headers' => ['*'],

    'exposed_headers' => [],

    'max_age' => 0,

    // Token-based auth (Sanctum bearer tokens) does not require credentialed
    // cookies, but leaving this true is safe and needed if you use SPA cookies.
    'supports_credentials' => true,
];
