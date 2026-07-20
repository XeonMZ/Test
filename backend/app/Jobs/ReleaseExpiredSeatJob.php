<?php

declare(strict_types=1);

namespace App\Jobs;

use App\Models\Booking;
use App\Modules\Booking\Application\Services\BookingService;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;

final class ReleaseExpiredSeatJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;
    public function __construct(public readonly string $bookingUuid) {}
    public function handle(BookingService $bookings): void
    {
        // Guard against early execution: the sync queue driver ignores delays,
        // so without this check seats would be released the moment a booking
        // is created. Only release once the lock countdown has truly elapsed
        // and the booking is still in a pre-payment state; the scheduled
        // booking:release-expired-seats sweep is the backstop.
        $booking = Booking::where('uuid', $this->bookingUuid)->first();
        if ($booking === null || $booking->expires_at === null) return;
        if (! in_array($booking->status, ['created', 'seat_locked', 'waiting_payment'], true)) return;
        if (now()->lt($booking->expires_at)) return;

        $bookings->releaseSeat($this->bookingUuid);
    }
}
