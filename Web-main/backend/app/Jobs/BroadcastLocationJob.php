<?php

namespace App\Jobs;

use App\Modules\Realtime\Domain\Events\DriverLocationUpdated;

final class BroadcastLocationJob
{
    public function __construct(public readonly DriverLocationUpdated $event) {}
    public function handle(): DriverLocationUpdated { return $this->event; }
}
