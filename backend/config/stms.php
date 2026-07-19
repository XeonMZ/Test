<?php

declare(strict_types=1);

$isProduction = env('APP_ENV') === 'production';
$betaMode = (bool) env('STMS_BETA_MODE', true) && ! $isProduction;

return [
    'beta_mode' => $betaMode,
    'optional_services_enabled' => ! $betaMode,
    // Explicit override wins; otherwise the scheduler runs whenever beta mode is off.
    'scheduler_enabled' => (bool) env('STMS_SCHEDULER_ENABLED', ! $betaMode),
];
