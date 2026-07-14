<?php

namespace App\Modules\Realtime\Domain\Events;

use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;

final readonly class TripStatusUpdated implements ShouldBroadcast
{
    public function __construct(public string $tripId, public string $bookingId, public string $status) {}
    public function broadcastOn(): array { return [new PrivateChannel('customer.' . $this->bookingId), new PrivateChannel('admin'), new PrivateChannel('owner')]; }
    public function broadcastAs(): string { return 'trip.status.updated'; }
    public function broadcastWith(): array { return ['trip_id' => $this->tripId, 'booking_id' => $this->bookingId, 'status' => $this->status]; }
}
