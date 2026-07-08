<?php

namespace App\Modules\CheckIn\Application\Services;

use App\Models\ActivityLog;
use App\Models\Ticket;
use App\Models\Trip;
use App\Modules\Tickets\Application\StateMachines\TicketStateMachine;
use App\Support\Observability\CorrelationContext;

final class PassengerStatusService
{
    public function __construct(private readonly TicketStateMachine $states) {}
    public function tripPassengers(string $trip): mixed
    {
        return Trip::with(['tickets.passenger', 'tickets.booking'])->where('uuid', $trip)->orWhere('id', $trip)->firstOrFail()->tickets;
    }

    public function transition(Ticket $ticket, string $status): Ticket
    {
        if ($ticket->status !== $status) $this->states->assertCanTransition($ticket->status, $status);
        $timestamps = match ($status) { 'checked_in' => ['checked_in_at'=>now()], 'boarded' => ['boarded_at'=>now()], 'completed' => ['completed_at'=>now()], default => [] };
        $ticket->update(['status'=>$status] + $timestamps);
        ActivityLog::create(['action'=>'passenger.'.$status,'subject_type'=>Ticket::class,'subject_id'=>$ticket->id,'metadata'=>['ticket_uuid'=>$ticket->uuid,'correlation_id'=>CorrelationContext::correlationId()]]);
        return $ticket->fresh();
    }
}
