<?php

$betaMode = (bool) env('STMS_BETA_MODE', true) && env('APP_ENV') !== 'production';

return [
    'default' => $betaMode ? 'file' : env('CACHE_STORE', 'file'),
    'stores' => [
        'array' => ['driver' => 'array'],
        'file' => ['driver' => 'file', 'path' => storage_path('framework/cache/data')],
        'redis' => ['driver' => 'redis', 'connection' => 'cache'],
    ],
    'prefix' => env('CACHE_PREFIX', 'stms_cache'),
];
