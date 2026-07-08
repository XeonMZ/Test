<?php

declare(strict_types=1);

namespace App\Listeners;

use App\Events\UserRegistered;
use App\Models\Notification;

final class SendWelcomeNotification
{
    public function handle(UserRegistered $event): void
    {
        Notification::create(['user_id' => $event->user->id, 'type' => 'welcome', 'title' => 'Selamat datang di STMS', 'body' => 'Akun customer Anda berhasil dibuat.', 'metadata' => []]);
    }
}
