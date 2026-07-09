<?php

declare(strict_types=1);

return [
    'token_name' => env('SANCTUM_TOKEN_NAME', 'stms-api-token'),
    'token_expiration_minutes' => (int) env('SANCTUM_TOKEN_EXPIRATION', 1440),
];
