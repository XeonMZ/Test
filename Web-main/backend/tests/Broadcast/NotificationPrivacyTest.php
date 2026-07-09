<?php

declare(strict_types=1);

use App\Modules\Realtime\Domain\Events\NotificationCreated;
use Illuminate\Broadcasting\PrivateChannel;
use PHPUnit\Framework\TestCase;

final class NotificationPrivacyTest extends TestCase
{
    public function test_notification_event_allows_private_identity_channels(): void
    {
        $event = new NotificationCreated(NotificationCreated::privateUserChannel(10), 'Title', 'Body');

        self::assertSame('notification.created', $event->broadcastAs());
        self::assertSame(['title' => 'Title', 'message' => 'Body'], $event->broadcastWith());
        self::assertContainsOnlyInstancesOf(PrivateChannel::class, $event->broadcastOn());
    }

    public function test_notification_event_rejects_resource_or_shared_customer_driver_channels(): void
    {
        $this->expectException(\InvalidArgumentException::class);

        new NotificationCreated('customer.123', 'Title', 'Body');
    }

    /** @dataProvider allowedRoleChannelProvider */
    public function test_notification_event_allows_authorized_role_channels(string $channel): void
    {
        $event = new NotificationCreated($channel, 'Title', 'Body');

        self::assertSame(['title' => 'Title', 'message' => 'Body'], $event->broadcastWith());
    }

    public static function allowedRoleChannelProvider(): array
    {
        return [['admin'], ['owner'], ['system']];
    }
}
