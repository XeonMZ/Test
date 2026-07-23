<?php

declare(strict_types=1);

namespace App\Listeners;

use App\Events\UserRegistered;
use App\Http\Controllers\EmailVerificationController;
use App\Support\Mail\TransactionalMailer;

/**
 * Queues the verification email automatically after successful registration —
 * hooked on the existing UserRegistered event, so the registration flow itself
 * is untouched and the API response is never blocked.
 */
final class SendVerificationEmail
{
    public function __construct(private readonly TransactionalMailer $mailer) {}

    public function handle(UserRegistered $event): void
    {
        if ($event->user->email_verified_at !== null) {
            return;
        }
        EmailVerificationController::queueFor($event->user, $this->mailer, 'register');
    }
}
