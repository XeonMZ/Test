<?php

declare(strict_types=1);

namespace Tests\Unit\Booking;

use App\Modules\Booking\Application\Services\BookingValidationService;
use Tests\TestCase;

final class BookingValidationTest extends TestCase
{
    public function test_booking_validation_service_is_resolvable(): void
    {
        self::assertInstanceOf(BookingValidationService::class, app(BookingValidationService::class));
    }
}
