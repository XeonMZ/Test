<?php

declare(strict_types=1);

namespace App\Modules\Booking\Infrastructure\Repositories;

use App\Models\Booking;
use App\Modules\Booking\Domain\Repositories\BookingRepository;
use Illuminate\Database\Eloquent\Collection;

final class EloquentBookingRepository implements BookingRepository
{
    public function findByUuid(string $uuid): ?Booking
    {
        return Booking::with(['schedule.route', 'schedule.vehicle', 'schedule.driver', 'customer.user', 'passengers', 'seatReservations.vehicleSeat', 'ticket', 'payment'])->where('uuid', $uuid)->first();
    }

    public function findById(int $id): ?Booking
    {
        return Booking::with(['schedule.route', 'customer.user', 'passengers', 'seatReservations.vehicleSeat', 'ticket', 'payment'])->find($id);
    }

    public function save(object $aggregate): object
    {
        $aggregate->save();
        return $aggregate->refresh();
    }

    public function customerBookings(int $customerId): Collection
    {
        return Booking::with(['schedule.route', 'passengers', 'seatReservations.vehicleSeat', 'ticket', 'payment'])->where('customer_id', $customerId)->latest()->get();
    }
}
