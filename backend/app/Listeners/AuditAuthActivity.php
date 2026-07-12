<?php

declare(strict_types=1);

namespace App\Listeners;

use App\Events\PasswordChanged;
use App\Events\ProfileUpdated;
use App\Events\UserLoggedIn;
use App\Events\UserLoggedOut;
use App\Events\UserRegistered;
use App\Models\ActivityLog;

final class AuditAuthActivity
{
    public function handle(object $event): void
    {
        $action = match ($event::class) {
            UserLoggedIn::class => 'auth.login',
            UserLoggedOut::class => 'auth.logout',
            UserRegistered::class => 'auth.register',
            PasswordChanged::class => 'auth.password_changed',
            ProfileUpdated::class => 'auth.profile_updated',
            default => 'auth.activity',
        };
        ActivityLog::create(['action' => $action, 'subject_type' => $event->user::class, 'subject_id' => $event->user->id, 'metadata' => $event->metadata]);
    }
}
