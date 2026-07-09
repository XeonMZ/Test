<?php

declare(strict_types=1);

namespace Tests\Feature\Booking;

use App\Http\Requests\SeatLockRequest;
use Tests\TestCase;

final class SeatLockApiTest extends TestCase
{
    public function test_seat_lock_request_requires_booking_and_seats(): void
    {
        $rules = (new SeatLockRequest())->rules();
        self::assertArrayHasKey('booking_uuid', $rules);
        self::assertArrayHasKey('seat_ids', $rules);
    }
}
