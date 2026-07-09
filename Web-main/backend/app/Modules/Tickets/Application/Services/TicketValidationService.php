<?php

namespace App\Modules\Tickets\Application\Services;

use App\Models\Ticket;
use App\Modules\Booking\Domain\ValueObjects\BookingStatus;
use App\Support\Enums\TripStatus;
use RuntimeException;

final class TicketValidationService
{
    public function assertCheckInAllowed(Ticket $ticket): void
    {
        $ticket->loadMissing(['booking', 'trip']);
        if (in_array($ticket->status, ['expired','cancelled','completed'], true)) throw new RuntimeException('Ticket tidak aktif.');
        if (in_array($ticket->status, ['checked_in','boarded'], true)) throw new RuntimeException('Ticket sudah digunakan.');
        if ($ticket->booking?->status !== BookingStatus::Paid->value && $ticket->booking?->status !== BookingStatus::TicketGenerated->value) throw new RuntimeException('Booking belum lunas.');
        if ($ticket->trip && in_array($ticket->trip->status, [TripStatus::Finished->value, TripStatus::Cancelled->value], true)) throw new RuntimeException('Trip sudah selesai atau dibatalkan.');
        if ($ticket->expires_at && $ticket->expires_at->isPast()) throw new RuntimeException('Ticket expired.');
    }

    public function assertBoardingAllowed(Ticket $ticket): void
    {
        if ($ticket->status !== 'checked_in') throw new RuntimeException('Passenger belum check-in atau sudah boarding.');
    }
}
