<?php

declare(strict_types=1);

namespace Tests\Feature\Booking;

use App\Modules\Booking\Presentation\BookingController;
use Tests\TestCase;

final class BookingApiTest extends TestCase
{
    public function test_booking_controller_exists(): void
    {
        self::assertTrue(class_exists(BookingController::class));
    }
}
