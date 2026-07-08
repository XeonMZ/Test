<?php

declare(strict_types=1);

namespace App\Modules\Realtime\Domain\Events;

use InvalidArgumentException;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;

final readonly class NotificationCreated implements ShouldBroadcast
{
    public function __construct(public string $channel, public string $title, public string $message)
    {
        if (! self::isAllowedNotificationChannel($channel)) {
            throw new InvalidArgumentException('Notifications may only be broadcast on private identity or authorized role channels.');
        }
    }

    public static function privateUserChannel(int|string $userId): string
    {
        return 'user.'.$userId;
    }

    public static function privateNotificationChannel(int|string $userId): string
    {
        return 'notification.'.$userId;
    }

    public function broadcastOn(): array { return [new PrivateChannel($this->channel)]; }
    public function broadcastAs(): string { return 'notification.created'; }
    public function broadcastWith(): array { return ['title'=>$this->title,'message'=>$this->message]; }

    private static function isAllowedNotificationChannel(string $channel): bool
    {
        return in_array($channel, ['admin', 'owner', 'system'], true)
            || (bool) preg_match('/^(user|notification)\.\d+$/', $channel);
    }
}
