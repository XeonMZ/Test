<?php

namespace App\Modules\CheckIn\Application\Services;

use App\Jobs\CheckInNotificationJob;
use App\Jobs\PassengerBoardingJob;
use App\Models\Ticket;
use App\Modules\Tickets\Application\Services\TicketValidationService;

final class BoardingService
{
    public function __construct(private readonly TicketValidationService $validator, private readonly PassengerStatusService $statuses) {}
    public function board(string $ticketUuid): Ticket
    {
        $ticket = Ticket::with(['booking','trip','passenger'])->where('uuid', $ticketUuid)->firstOrFail();
        $this->validator->assertBoardingAllowed($ticket);
        $ticket = $this->statuses->transition($ticket, 'boarded');
        PassengerBoardingJob::dispatch($ticket->uuid);
        CheckInNotificationJob::dispatch($ticket->uuid, 'boarded');
        return $ticket;
    }
}
