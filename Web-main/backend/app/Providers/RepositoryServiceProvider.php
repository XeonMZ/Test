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
            \App\Support\Settings\SettingsRepository::class => \App\Support\Settings\InMemorySettingsRepository::class,
            \App\Support\FeatureFlags\FeatureFlagRepository::class => \App\Support\FeatureFlags\InMemoryFeatureFlagRepository::class,
            \App\Modules\Gps\Domain\Repositories\DriverLocationRepository::class => \App\Modules\Gps\Infrastructure\InMemoryDriverLocationRepository::class,
            \App\Modules\Payments\Domain\Repositories\PaymentRepository::class => \App\Modules\Payments\Infrastructure\Repositories\EloquentPaymentRepository::class,
            \App\Modules\Payments\Domain\Repositories\PaymentGateway::class => \App\Modules\Payments\Infrastructure\Gateways\MidtransGateway::class,
            \App\Modules\Tickets\Domain\Repositories\TicketRepository::class => \App\Modules\Tickets\Infrastructure\Repositories\EloquentTicketRepository::class,
            \App\Modules\Tickets\Infrastructure\Storage\TicketStorage::class => \App\Modules\Tickets\Infrastructure\Storage\LocalTicketStorage::class,
        ];
        foreach ($bindings as $abstract => $concrete) {
            if ($abstract === \App\Modules\Payments\Domain\Repositories\PaymentGateway::class) {
                $this->app->bind($abstract, fn (): \App\Modules\Payments\Domain\Repositories\PaymentGateway => new \App\Modules\Payments\Infrastructure\Gateways\MidtransGateway((string) config('payment.midtrans.server_key'), (string) config('payment.midtrans.client_key'), (bool) config('payment.midtrans.sandbox')));
                continue;
            }
            $this->app->bind($abstract, $concrete);
        }
    }
}
