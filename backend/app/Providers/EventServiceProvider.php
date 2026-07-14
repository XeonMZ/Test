<?php

declare(strict_types=1);

namespace App\Providers;

use App\Events\PasswordChanged;
use App\Events\ProfileUpdated;
use App\Events\UserLoggedIn;
use App\Events\UserLoggedOut;
use App\Events\UserRegistered;
use App\Listeners\AuditAuthActivity;
use App\Listeners\SendWelcomeNotification;
use App\Listeners\UpdateLastLogin;
use Illuminate\Foundation\Support\Providers\EventServiceProvider as ServiceProvider;

final class EventServiceProvider extends ServiceProvider
{
    protected $listen = [
        UserLoggedIn::class => [UpdateLastLogin::class, AuditAuthActivity::class],
        UserRegistered::class => [SendWelcomeNotification::class, AuditAuthActivity::class],
        UserLoggedOut::class => [AuditAuthActivity::class],
        PasswordChanged::class => [AuditAuthActivity::class],
        ProfileUpdated::class => [AuditAuthActivity::class],
    ];
}
