<?php

namespace App\Modules\CheckIn\Application\Services;

use App\Jobs\CheckInNotificationJob;
use App\Jobs\PassengerCheckInJob;
use App\Models\Ticket as TicketModel;
use App\Modules\CheckIn\Domain\Entities\PassengerCheckIn;
use App\Modules\Tickets\Application\Services\TicketService;
use App\Modules\Tickets\Application\Services\TicketValidationService;
use Illuminate\Support\Facades\DB;

final class CheckInService
{
    public function __construct(private readonly TicketService $tickets, private readonly TicketValidationService $validator, private readonly PassengerStatusService $statuses) {}

    public function checkIn(string $qrPayload, string $driverUuid, ?float $latitude, ?float $longitude): PassengerCheckIn
    {
        $ticketEntity = $this->tickets->validatePayload($qrPayload);
        $ticket = TicketModel::with(['booking','trip'])->where('uuid', $ticketEntity->uuid)->lockForUpdate()->firstOrFail();
        $this->validator->assertCheckInAllowed($ticket);
        $this->statuses->transition($ticket, 'checked_in');
        DB::table('passenger_check_ins')->insert(['ticket_uuid'=>$ticket->uuid,'verification_token'=>$ticket->verification_token,'driver_uuid'=>$driverUuid,'status'=>'checked_in','latitude'=>$latitude,'longitude'=>$longitude,'recorded_at'=>now(),'metadata'=>json_encode(['booking_uuid'=>$ticket->booking?->uuid]),'created_at'=>now(),'updated_at'=>now()]);
        PassengerCheckInJob::dispatch($ticket->uuid, $driverUuid);
        CheckInNotificationJob::dispatch($ticket->uuid, 'checked_in');
        return new PassengerCheckIn($ticket->uuid, $driverUuid, $latitude, $longitude, 'checked_in', now()->toIso8601String());
    }

    public function noShow(string $ticketUuid, string $driverUuid, ?float $latitude, ?float $longitude): PassengerCheckIn
    {
        $ticket = TicketModel::where('uuid', $ticketUuid)->lockForUpdate()->firstOrFail();
        $this->statuses->transition($ticket, 'no_show');
        DB::table('passenger_check_ins')->insert(['ticket_uuid'=>$ticket->uuid,'verification_token'=>$ticket->verification_token,'driver_uuid'=>$driverUuid,'status'=>'no_show','latitude'=>$latitude,'longitude'=>$longitude,'recorded_at'=>now(),'metadata'=>json_encode([]),'created_at'=>now(),'updated_at'=>now()]);
        CheckInNotificationJob::dispatch($ticket->uuid, 'no_show');
        return new PassengerCheckIn($ticket->uuid, $driverUuid, $latitude, $longitude, 'no_show', now()->toIso8601String());
    }
}
