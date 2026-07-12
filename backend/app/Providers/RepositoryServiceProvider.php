<?php

declare(strict_types=1);

namespace App\Providers;

use Illuminate\Support\ServiceProvider;

final class RepositoryServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        $bindings = [
            \App\Modules\Booking\Domain\Repositories\BookingRepository::class => \App\Modules\Booking\Infrastructure\Repositories\EloquentBookingRepository::class,
            \App\Support\Cache\CacheStore::class => \App\Support\Cache\LaravelCacheStore::class,
            \App\Support\Settings\SettingsRepository::class => \App\Support\Settings\DatabaseSettingsRepository::class,
            \App\Support\FeatureFlags\FeatureFlagRepository::class => \App\Support\FeatureFlags\DatabaseFeatureFlagRepository::class,
            \App\Modules\Gps\Domain\Repositories\DriverLocationRepository::class => \App\Modules\Gps\Infrastructure\EloquentDriverLocationRepository::class,
            \App\Modules\Payments\Domain\Repositories\PaymentRepository::class => \App\Modules\Payments\Infrastructure\Repositories\EloquentPaymentRepository::class,
            \App\Modules\Tickets\Domain\Repositories\TicketRepository::class => \App\Modules\Tickets\Infrastructure\Repositories\EloquentTicketRepository::class,
            \App\Modules\Tickets\Infrastructure\Storage\TicketStorage::class => \App\Modules\Tickets\Infrastructure\Storage\LocalTicketStorage::class,
        ];
        $this->app->bind(\App\Modules\Payments\Domain\Repositories\PaymentGateway::class, function (): \App\Modules\Payments\Domain\Repositories\PaymentGateway {
            if ((bool) config('stms.optional_services_enabled', false)) {
                return new \App\Modules\Payments\Infrastructure\Gateways\MidtransGateway((string) config('payment.midtrans.server_key'), (string) config('payment.midtrans.client_key'), (bool) config('payment.midtrans.sandbox'));
            }

            return new \App\Modules\Payments\Infrastructure\Gateways\BetaPaymentGateway();
        });

        foreach ($bindings as $abstract => $concrete) {
            $this->app->bind($abstract, $concrete);
        }
    }
}
