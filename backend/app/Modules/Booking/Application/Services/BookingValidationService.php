<?php

declare(strict_types=1);

namespace App\Modules\Booking\Application\Services;

use App\Models\Booking;
use App\Models\Customer;
use App\Models\Schedule;
use App\Models\SeatReservation;
use App\Models\VehicleSeat;
use App\Support\Exceptions\BookingException;
use App\Support\Exceptions\DriverException;
use App\Support\Exceptions\PricingException;
use App\Support\Exceptions\RouteException;
use App\Support\Exceptions\SeatException;
use App\Support\Exceptions\TripException;
use App\Support\Exceptions\VehicleException;
use Illuminate\Support\Carbon;

final class BookingValidationService
{
    public function validateCreate(Customer $customer, Schedule $schedule, array $seatIds, float $amount): void
    {
        if ($customer->trashed()) { throw new BookingException('Customer tidak valid.'); }
        if ($schedule->trashed() || $schedule->status !== 'scheduled') { throw new BookingException('Schedule tidak aktif.'); }
        if ($schedule->departure_at->isPast()) { throw new BookingException('Jadwal sudah berangkat.'); }
        if (!$schedule->route || $schedule->route->trashed()) { throw new RouteException('Route tidak aktif.'); }
        if (!$schedule->vehicle || $schedule->vehicle->trashed() || $schedule->vehicle->status !== 'active') { throw new VehicleException('Vehicle tidak aktif.'); }
        if (!$schedule->driver || $schedule->driver->trashed() || !in_array($schedule->driver->status, ['available', 'assigned'], true)) { throw new DriverException('Driver tidak aktif.'); }
        if ($schedule->trip && $schedule->trip->trashed()) { throw new TripException('Trip tidak aktif.'); }
        if ($amount <= 0 || (float) $schedule->base_fare <= 0) { throw new PricingException('Harga tidak valid.'); }
        if ($seatIds === []) { throw new SeatException('Kursi wajib dipilih.'); }
        if (count($seatIds) !== count(array_unique($seatIds))) { throw new SeatException('Kursi duplicate dalam request.'); }
        $capacity = (int) ($schedule->vehicle->layout?->capacity ?? $schedule->vehicle->seats()->count());
        $activeReservations = SeatReservation::whereHas('booking', fn ($q) => $q->where('schedule_id', $schedule->id)->whereIn('status', ['seat_locked', 'waiting_payment', 'paid', 'ticket_generated']))->count();
        if ($activeReservations + count($seatIds) > $capacity) { throw new SeatException('Kapasitas kendaraan penuh.'); }
        $duplicate = Booking::where('customer_id', $customer->id)->where('schedule_id', $schedule->id)->whereIn('status', ['draft', 'seat_locked', 'waiting_payment', 'paid', 'ticket_generated'])->exists();
        if ($duplicate) { throw new BookingException('Customer sudah memiliki booking aktif untuk schedule ini.'); }
    }

    public function assertSeatsAvailable(Schedule $schedule, array $seatIds, Carbon $now): void
    {
        $vehicleSeatCount = VehicleSeat::where('vehicle_id', $schedule->vehicle_id)->whereIn('id', $seatIds)->where('is_active', true)->count();
        if ($vehicleSeatCount !== count($seatIds)) { throw new SeatException('Kursi tidak valid untuk kendaraan ini.'); }
        $taken = SeatReservation::whereIn('vehicle_seat_id', $seatIds)
            ->whereHas('booking', fn ($q) => $q->where('schedule_id', $schedule->id))
            ->where(function ($query) use ($now): void {
                $query->whereIn('status', ['confirmed', 'paid', 'ticket_generated'])
                    ->orWhere(fn ($q) => $q->whereIn('status', ['locked', 'waiting_payment'])->where('locked_until', '>', $now));
            })->exists();
        if ($taken) { throw new SeatException('Kursi sudah dikunci atau terjual.'); }
    }
}
