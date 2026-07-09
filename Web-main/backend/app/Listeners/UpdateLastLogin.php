<?php

declare(strict_types=1);

namespace App\Listeners;

use App\Events\UserLoggedIn;

final class UpdateLastLogin
{
    public function handle(UserLoggedIn $event): void
    {
        $event->user->forceFill(['last_login_at' => now()])->save();
    }
}
