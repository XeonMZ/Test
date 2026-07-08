<?php
namespace App\Modules\Drivers\Application\Services;
use App\Models\ActivityLog; use App\Models\Trip; use App\Support\Observability\CorrelationContext;
final class TripTimelineService { public function record(Trip $trip,string $event,array $metadata=[]): ActivityLog { return ActivityLog::create(['action'=>'trip.timeline.'.$event,'subject_type'=>Trip::class,'subject_id'=>$trip->id,'metadata'=>['trip_uuid'=>$trip->uuid,'driver_id'=>$trip->driver_id,'correlation_id'=>CorrelationContext::correlationId()]+$metadata]); } public function forDriver(int $driverId): array { return ActivityLog::query()->where('action','like','trip.timeline.%')->where('metadata->driver_id',$driverId)->latest()->limit(100)->get()->all(); }}
