<?php

namespace App\Modules\Realtime\Domain\Events;

use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;

final readonly class DriverLocationUpdated implements ShouldBroadcast
{
    public function __construct(public string $driverId, public string $tripId, public float $latitude, public float $longitude, public string $recordedAt) {}
    public function broadcastOn(): array { return [new PrivateChannel('driver.' . $this->driverId), new PrivateChannel('admin'), new PrivateChannel('owner')]; }
    public function broadcastAs(): string { return 'driver.location.updated'; }
    public function broadcastWith(): array { return ['driver_id' => $this->driverId, 'trip_id' => $this->tripId, 'latitude' => $this->latitude, 'longitude' => $this->longitude, 'recorded_at' => $this->recordedAt]; }
}
