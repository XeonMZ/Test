<?php

return [
    // Which gateway to bind: 'midtrans', 'beta' (offline/sandbox), or 'auto'
    // (midtrans when MIDTRANS_SERVER_KEY is configured, beta otherwise).
    'gateway' => env('PAYMENT_GATEWAY', 'auto'),
    'expiry_minutes' => (int) env('PAYMENT_EXPIRY_MINUTES', 15),
    'reminder_minutes' => (int) env('PAYMENT_REMINDER_MINUTES', 10),
    'midtrans' => [
        'server_key' => env('MIDTRANS_SERVER_KEY', ''),
        'client_key' => env('MIDTRANS_CLIENT_KEY', ''),
        'sandbox' => (bool) env('MIDTRANS_SANDBOX', true),
    ],
    'beta' => [
        'webhook_secret' => env('BETA_WEBHOOK_SECRET', ''),
    ],
];
