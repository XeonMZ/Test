<?php

namespace App\Jobs;

use App\Modules\Realtime\Domain\Events\TripStatusUpdated;

final class BroadcastTripStatusJob
{
    public function __construct(public readonly TripStatusUpdated $event) {}
    public function handle(): TripStatusUpdated { return $this->event; }
}
