<?php

use App\Modules\Booking\Application\StateMachines\BookingStateMachine;
use App\Modules\Booking\Domain\ValueObjects\BookingStatus;
use PHPUnit\Framework\TestCase;

final class BookingStateMachineTest extends TestCase
{
    public function test_waiting_payment_can_be_paid(): void
    {
        $machine = new BookingStateMachine();
        self::assertSame(BookingStatus::Paid, $machine->transition(BookingStatus::WaitingPayment, BookingStatus::Paid));
    }

    public function test_paid_can_generate_ticket(): void
    {
        $machine = new BookingStateMachine();
        self::assertSame(BookingStatus::TicketGenerated, $machine->transition(BookingStatus::Paid, BookingStatus::TicketGenerated));
    }

    public function test_draft_cannot_be_completed(): void
    {
        $this->expectException(DomainException::class);
        (new BookingStateMachine())->transition(BookingStatus::Draft, BookingStatus::Completed);
    }
}
