<?php

$betaMode = (bool) env('STMS_BETA_MODE', true) && env('APP_ENV') !== 'production';

return [
    'default' => $betaMode ? 'sync' : env('QUEUE_CONNECTION', 'sync'),
    'connections' => [
        'sync' => ['driver' => 'sync'],
        'database' => ['driver' => 'database', 'table' => 'jobs', 'queue' => 'default', 'retry_after' => 90],
        'redis' => ['driver' => 'redis', 'connection' => 'default', 'queue' => env('REDIS_QUEUE', 'default'), 'retry_after' => 90, 'block_for' => null],
    ],
    'failed' => ['driver' => 'database-uuids', 'database' => env('DB_CONNECTION', 'mysql'), 'table' => 'failed_jobs'],
];
