<?php

namespace App\Jobs;

use App\Modules\Realtime\Domain\Events\NotificationCreated;

final class BroadcastNotificationJob
{
    public function __construct(public readonly NotificationCreated $event) {}
    public function handle(): NotificationCreated { return $this->event; }
}
