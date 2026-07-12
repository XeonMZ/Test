<?php

declare(strict_types=1);

namespace Tests\Unit\Booking;

use App\Modules\Booking\Application\StateMachines\BookingStateMachine;
use App\Modules\Booking\Domain\ValueObjects\BookingStatus;
use DomainException;
use Tests\TestCase;

final class BookingPolicyTest extends TestCase
{
    public function test_paid_booking_cannot_expire(): void
    {
        $this->expectException(DomainException::class);
        app(BookingStateMachine::class)->assertCanTransition(BookingStatus::Paid, BookingStatus::Expired);
    }
}
