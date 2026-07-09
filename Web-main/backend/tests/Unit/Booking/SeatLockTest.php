<?php

declare(strict_types=1);

namespace Tests\Unit\Booking;

use App\Models\SeatReservation;
use Tests\TestCase;

final class SeatLockTest extends TestCase
{
    public function test_seat_reservation_casts_lock_timestamps(): void
    {
        $reservation = new SeatReservation(['locked_until' => now()->addMinutes(10), 'released_at' => now()]);
        self::assertArrayHasKey('locked_until', $reservation->getCasts());
        self::assertArrayHasKey('released_at', $reservation->getCasts());
    }
}
