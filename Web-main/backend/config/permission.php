<?php

declare(strict_types=1);

return [
    'roles' => ['customer', 'driver', 'admin', 'owner'],
    'permissions' => [
        'customer' => ['booking:create', 'ticket:read', 'history:read', 'tracking:read'],
        'driver' => ['trip:read', 'trip:update-status', 'gps:update', 'passenger:read'],
        'admin' => ['operations:*', 'booking:*', 'ticket:*', 'route:*', 'vehicle:*', 'driver:*', 'schedule:*', 'payment:read', 'customer:read'],
        'owner' => ['*'],
    ],
];
