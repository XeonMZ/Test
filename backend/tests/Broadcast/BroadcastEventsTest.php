<?php

use PHPUnit\Framework\TestCase;

final class BroadcastEventsTest extends TestCase
{
    public function test_broadcast_events_exist(): void
    {
        self::assertTrue(class_exists(App\Modules\Realtime\Domain\Events\DriverLocationUpdated::class));
        self::assertTrue(class_exists(App\Modules\Realtime\Domain\Events\TripStatusUpdated::class));
        self::assertTrue(class_exists(App\Modules\Realtime\Domain\Events\NotificationCreated::class));
    }
}
