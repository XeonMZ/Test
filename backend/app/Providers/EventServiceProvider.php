<?php

declare(strict_types=1);

namespace App\Providers;

use App\Events\PasswordChanged;
use App\Events\ProfileUpdated;
use App\Events\UserLoggedIn;
use App\Events\UserLoggedOut;
use App\Events\UserRegistered;
use App\Listeners\AuditAuthActivity;
use App\Listeners\SendBookingLifecycleEmails;
use App\Listeners\SendVerificationEmail;
use App\Listeners\SendWelcomeNotification;
use App\Listeners\UpdateLastLogin;
use App\Modules\Booking\Domain\Events\BookingCancelled;
use App\Modules\Payments\Domain\Events\PaymentExpired;
use App\Modules\Payments\Domain\Events\PaymentFailed;
use App\Modules\Payments\Domain\Events\PaymentSucceeded;
use Illuminate\Foundation\Support\Providers\EventServiceProvider as ServiceProvider;

final class EventServiceProvider extends ServiceProvider
{
    protected $listen = [
        UserLoggedIn::class => [UpdateLastLogin::class, AuditAuthActivity::class],
        UserRegistered::class => [SendWelcomeNotification::class, AuditAuthActivity::class, SendVerificationEmail::class],
        UserLoggedOut::class => [AuditAuthActivity::class],
        PasswordChanged::class => [AuditAuthActivity::class],
        ProfileUpdated::class => [AuditAuthActivity::class],
        // Resend email integration — hooked on existing domain events.
        PaymentSucceeded::class => [[SendBookingLifecycleEmails::class, 'handlePaymentSucceeded']],
        PaymentFailed::class => [[SendBookingLifecycleEmails::class, 'handlePaymentFailed']],
        PaymentExpired::class => [[SendBookingLifecycleEmails::class, 'handlePaymentFailed']],
        BookingCancelled::class => [[SendBookingLifecycleEmails::class, 'handleBookingCancelled']],
    ];
}
