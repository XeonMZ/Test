<?php

return [
    'postmark' => [
        'token' => env('POSTMARK_TOKEN'),
    ],
    'ses' => [
        'key' => env('AWS_ACCESS_KEY_ID'),
        'secret' => env('AWS_SECRET_ACCESS_KEY'),
        'region' => env('AWS_DEFAULT_REGION', 'us-east-1'),
    ],
    'resend' => [
        'key' => env('RESEND_KEY'),
    ],
    'midtrans' => [
        'server_key' => env('MIDTRANS_SERVER_KEY', ''),
        'client_key' => env('MIDTRANS_CLIENT_KEY', ''),
        'sandbox' => (bool) env('MIDTRANS_SANDBOX', true),
    ],
    'slack' => [
        'notifications' => [
            'bot_user_oauth_token' => env('SLACK_BOT_USER_OAUTH_TOKEN'),
            'channel' => env('SLACK_BOT_USER_DEFAULT_CHANNEL'),
        ],
    ],

    // Map providers (Provider Pattern — see App\Support\Maps\MapProviderResolver)
    'google_maps' => [
        'key' => env('GOOGLE_MAPS_API_KEY'), // backend-side hint only; the JS key is NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
    ],
    'osrm' => [
        'url' => env('OSRM_URL', 'https://router.project-osrm.org'),
    ],
];
