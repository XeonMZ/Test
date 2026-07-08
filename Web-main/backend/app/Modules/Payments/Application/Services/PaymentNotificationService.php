<?php

namespace App\Modules\Payments\Application\Services;

use App\Models\Booking;
use App\Models\Notification;

final class PaymentNotificationService
{
    public function notify(Booking $booking, string $type): void
    {
        $booking->loadMissing(['customer.user', 'schedule.driver.user']);
        $targets = array_filter([$booking->customer?->user, $booking->schedule?->driver?->user]);
        foreach ($targets as $user) {
            Notification::create(['user_id' => $user->id, 'type' => 'payment_'.$type, 'title' => 'Payment '.ucfirst($type), 'body' => 'Status pembayaran booking '.$booking->code.' adalah '.$type.'.', 'metadata' => ['booking_uuid' => $booking->uuid]]);
        }
    }
}
