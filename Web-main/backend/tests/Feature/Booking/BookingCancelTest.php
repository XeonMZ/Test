<?php

declare(strict_types=1);

namespace Tests\Feature\Booking;

use App\Modules\Booking\Domain\Events\BookingCancelled;
use Tests\TestCase;

final class BookingCancelTest extends TestCase
{
    public function test_booking_cancel_event_exists(): void
    {
        self::assertTrue(class_exists(BookingCancelled::class));
    }
}
