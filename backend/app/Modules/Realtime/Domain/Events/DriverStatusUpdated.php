<?php
namespace App\Modules\Realtime\Domain\Events;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
final readonly class DriverStatusUpdated implements ShouldBroadcast { public function __construct(public string $driverId, public string $status) {} public function broadcastOn(): array { return [new PrivateChannel('driver.'.$this->driverId), new PrivateChannel('admin'), new PrivateChannel('owner')]; } public function broadcastAs(): string { return 'driver.status.updated'; } public function broadcastWith(): array { return ['driver_id'=>$this->driverId,'status'=>$this->status]; }}
