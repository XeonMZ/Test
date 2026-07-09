<?php

declare(strict_types=1);

namespace App\Modules\Booking\Application\Services;

use App\Models\Booking;
use App\Models\Notification;
use App\Models\User;

final class BookingNotificationService
{
    public function notifyCustomer(Booking $booking, string $type, string $title, string $body): void
    {
        $user = $booking->customer?->user;
        if ($user) { $this->create($user, $type, $title, $body, $booking); }
    }

    public function notifyDriver(Booking $booking): void
    {
        $user = $booking->schedule?->driver?->user;
        if ($user) { $this->create($user, 'new_passenger', 'Penumpang baru', 'Ada booking baru pada jadwal Anda.', $booking); }
    }

    public function notifyAdmins(Booking $booking): void
    {
        User::whereIn('role', ['admin'])->get()->each(fn (User $user) => $this->create($user, 'new_booking', 'Booking baru', 'Booking baru dibuat.', $booking));
    }

    private function create(User $user, string $type, string $title, string $body, Booking $booking): void
    {
        Notification::create(['user_id' => $user->id, 'type' => $type, 'title' => $title, 'body' => $body, 'metadata' => ['booking_uuid' => $booking->uuid]]);
    }
}
