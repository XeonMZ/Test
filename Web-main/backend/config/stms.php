<?php

declare(strict_types=1);

$isProduction = env('APP_ENV') === 'production';
$betaMode = (bool) env('STMS_BETA_MODE', true) && ! $isProduction;

return [
    'beta_mode' => $betaMode,
    'optional_services_enabled' => ! $betaMode,
    'scheduler_enabled' => ! $betaMode,
];
