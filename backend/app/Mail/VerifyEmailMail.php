<?php

declare(strict_types=1);

namespace App\Mail;

use App\Models\User;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Queue\SerializesModels;

/** Email Preview 1 — account verification with signed link. */
final class VerifyEmailMail extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(
        public readonly User $user,
        public readonly string $verificationUrl,
        public readonly int $expireMinutes,
    ) {}

    public function build(): self
    {
        return $this
            ->subject('Verify Your Email - SJT Travel')
            ->view('emails.verify-email')
            ->text('emails.verify-email-text')
            ->with(['user' => $this->user, 'verificationUrl' => $this->verificationUrl, 'expireMinutes' => $this->expireMinutes]);
    }
}
