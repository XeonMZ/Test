<?php

declare(strict_types=1);

namespace App\Mail;

use App\Models\User;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Queue\SerializesModels;
use App\Support\Mail\EmailTemplate;

/** Email Preview 2 — password reset (single-use hashed token, broker-issued). */
final class ResetPasswordMail extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(
        public readonly User $user,
        public readonly string $resetUrl,
        public readonly int $expireMinutes,
    ) {}

    public function build(): self
    {
        return $this
            ->subject(EmailTemplate::resolve('reset_password', ['subject' => 'Reset Your Password - SJT Travel', 'heading' => '', 'intro' => ''], ['name' => $this->user->name])['subject'])
            ->view('emails.reset-password')
            ->text('emails.reset-password-text')
            ->with(['user' => $this->user, 'resetUrl' => $this->resetUrl, 'expireMinutes' => $this->expireMinutes]);
    }
}
