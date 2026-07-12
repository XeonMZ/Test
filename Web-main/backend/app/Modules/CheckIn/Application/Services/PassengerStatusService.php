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
        $model = Trip::with(['tickets.passenger', 'tickets.booking'])->where('uuid', $trip)->orWhere('id', $trip)->firstOrFail();

        // #6 Expose each passenger's pickup & drop points so the driver map can
        // list them (pickup first, then drop), ordered nearest-first client-side.
        return $model->tickets->map(function ($ticket) {
            $booking = $ticket->booking;
            return [
                'uuid' => $ticket->uuid,
                'ticket_number' => $ticket->ticket_number,
                'status' => $ticket->status,
                'passenger' => ['name' => $ticket->passenger?->name],
                'pickup' => $booking?->pickup_lat ? ['label' => $booking->pickup_label, 'lat' => (float) $booking->pickup_lat, 'lng' => (float) $booking->pickup_lng] : null,
                'drop' => $booking?->drop_lat ? ['label' => $booking->drop_label, 'lat' => (float) $booking->drop_lat, 'lng' => (float) $booking->drop_lng] : null,
                'direction' => $booking?->direction,
            ];
        });
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
