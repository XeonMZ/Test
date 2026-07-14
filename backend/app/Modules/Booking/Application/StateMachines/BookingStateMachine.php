<?php

declare(strict_types=1);

namespace App\Modules\Booking\Application\StateMachines;

use App\Modules\Booking\Domain\ValueObjects\BookingStatus;
use DomainException;

final class BookingStateMachine
{
    private const TRANSITIONS = [
        'draft' => ['seat_locked', 'cancelled', 'expired'],
        'seat_locked' => ['waiting_payment', 'cancelled', 'expired'],
        'waiting_payment' => ['paid', 'cancelled', 'expired'],
        'paid' => ['ticket_generated', 'ticket_issued', 'refunded'],
        'ticket_generated' => ['completed', 'cancelled'],
        'ticket_issued' => ['checked_in', 'completed', 'cancelled'],
        'checked_in' => ['completed'],
        'completed' => [],
        'cancelled' => [],
        'expired' => [],
        'refunded' => [],
    ];

    public function assertCanTransition(BookingStatus $from, BookingStatus $to): void
    {
        if (! in_array($to->value, self::TRANSITIONS[$from->value], true)) {
            throw new DomainException("Invalid booking transition from {$from->value} to {$to->value}");
        }
    }

    public function transition(BookingStatus $from, BookingStatus $to): BookingStatus
    {
        $this->assertCanTransition($from, $to);
        return $to;
    }
}
