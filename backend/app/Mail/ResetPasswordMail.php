<?php

declare(strict_types=1);

namespace App\Mail;

use App\Models\User;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Queue\SerializesModels;

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
            ->subject('Reset Your Password - SJT Travel')
            ->view('emails.reset-password')
            ->text('emails.reset-password-text')
            ->with(['user' => $this->user, 'resetUrl' => $this->resetUrl, 'expireMinutes' => $this->expireMinutes]);
    }
}
