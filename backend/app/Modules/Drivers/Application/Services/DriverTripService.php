<?php
namespace App\Modules\Drivers\Application\Services;
use App\Models\ActivityLog; use App\Models\Trip; use App\Modules\Drivers\Application\StateMachines\DriverTripStateMachine; use App\Modules\Realtime\Domain\Events\TripStatusUpdated; use App\Support\Observability\CorrelationContext;
final class DriverTripService { public function __construct(private readonly DriverTripStateMachine $states, private readonly TripTimelineService $timeline) {} public function acceptTrip(Trip $trip): Trip { return $this->move($trip,DriverTripStateMachine::ACCEPTED,'driver_accepted'); } public function rejectTrip(Trip $trip): Trip { return $this->move($trip,DriverTripStateMachine::CANCELLED,'trip_cancelled'); } public function startTrip(Trip $trip): Trip { return $this->move($trip,DriverTripStateMachine::STARTED,'driver_started'); } public function pauseTrip(Trip $trip): Trip { return $this->move($trip,DriverTripStateMachine::PICKUP,'pickup_reached'); } public function resumeTrip(Trip $trip): Trip { return $this->move($trip,DriverTripStateMachine::ON_ROUTE,'on_route'); } public function finishTrip(Trip $trip): Trip { return $this->move($trip,DriverTripStateMachine::COMPLETED,'trip_finished'); } public function cancelTrip(Trip $trip): Trip { return $this->move($trip,DriverTripStateMachine::CANCELLED,'trip_cancelled'); }
    /**
     * Walk the state machine legally from the current status up to $target
     * (fix for "Invalid trip transition ready -> started": trips created as
     * ready/assigned can now be started or finished in one driver action —
     * every intermediate step is recorded on the timeline as before).
     */
    public function advanceTo(Trip $trip, string $target): Trip {
        $order=[DriverTripStateMachine::READY,DriverTripStateMachine::ASSIGNED,DriverTripStateMachine::ACCEPTED,DriverTripStateMachine::STARTED,DriverTripStateMachine::PICKUP,DriverTripStateMachine::BOARDING,DriverTripStateMachine::ON_ROUTE,DriverTripStateMachine::DROP_OFF,DriverTripStateMachine::COMPLETED];
        $events=[DriverTripStateMachine::ASSIGNED=>'trip_assigned',DriverTripStateMachine::ACCEPTED=>'driver_accepted',DriverTripStateMachine::STARTED=>'driver_started',DriverTripStateMachine::PICKUP=>'pickup_reached',DriverTripStateMachine::BOARDING=>'boarding',DriverTripStateMachine::ON_ROUTE=>'on_route',DriverTripStateMachine::DROP_OFF=>'drop_off',DriverTripStateMachine::COMPLETED=>'trip_finished'];
        $from=array_search($trip->status ?: DriverTripStateMachine::READY,$order,true);
        $to=array_search($target,$order,true);
        if($from===false||$to===false||$to<$from){ throw new \InvalidArgumentException("Invalid trip transition {$trip->status} -> {$target}"); }
        for($i=$from+1;$i<=$to;$i++){ $trip=$this->move($trip,$order[$i],$events[$order[$i]]); }
        return $trip;
    } private function move(Trip $trip,string $to,string $event): Trip { $from=$trip->status ?: DriverTripStateMachine::READY; $trip->forceFill(['status'=>$this->states->transition($from,$to)])->save(); ActivityLog::create(['action'=>'trip.status.'.$to,'subject_type'=>Trip::class,'subject_id'=>$trip->id,'metadata'=>['from'=>$from,'to'=>$to,'trip_uuid'=>$trip->uuid,'correlation_id'=>CorrelationContext::correlationId()]]); $this->timeline->record($trip,$event,['from'=>$from,'to'=>$to]); event(new TripStatusUpdated((string)$trip->id,(string)($trip->booking_id ?? $trip->id),$to)); return $trip; }}
