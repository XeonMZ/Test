<?php

declare(strict_types=1);

namespace Tests\Unit\Booking;

use App\Modules\Booking\Application\Services\BookingService;
use Tests\TestCase;

final class BookingServiceTest extends TestCase
{
    public function test_booking_service_is_resolvable(): void
    {
        self::assertInstanceOf(BookingService::class, app(BookingService::class));
    }
}
