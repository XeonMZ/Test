<?php

$providers = [
    App\Providers\AppServiceProvider::class,
    App\Providers\RepositoryServiceProvider::class,
    App\Providers\EventServiceProvider::class,
];

$betaMode = (bool) env('STMS_BETA_MODE', true) && env('APP_ENV') !== 'production';

if (! $betaMode && class_exists(\Laravel\Reverb\ReverbServiceProvider::class)) {
    $providers[] = \Laravel\Reverb\ReverbServiceProvider::class;
}

return $providers;
