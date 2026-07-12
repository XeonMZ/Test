<?php

declare(strict_types=1);

namespace App\Modules\Booking\Domain\ValueObjects;

enum BookingStatus: string
{
    case Draft = 'draft';
    case SeatLocked = 'seat_locked';
    case WaitingPayment = 'waiting_payment';
    case Paid = 'paid';
    case TicketGenerated = 'ticket_generated';
    case TicketIssued = 'ticket_issued';
    case CheckedIn = 'checked_in';
    case Completed = 'completed';
    case Cancelled = 'cancelled';
    case Expired = 'expired';
    case Refunded = 'refunded';
}
