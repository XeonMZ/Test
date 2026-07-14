<?php

namespace App\Modules\Tickets\Application\Services;

use App\Models\Ticket;

final class TicketPdfService
{
    public function render(Ticket $ticket): string
    {
        return "STMS E-Ticket\nTicket: {$ticket->ticket_number}\nBooking: {$ticket->booking?->uuid}\nStatus: {$ticket->status}\n";
    }
}
