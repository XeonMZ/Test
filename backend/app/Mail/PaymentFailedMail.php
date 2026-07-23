<?php

declare(strict_types=1);

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Queue\SerializesModels;

/** Email Preview 4 — payment failed with retry CTA. */
final class PaymentFailedMail extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(
        public readonly string $name,
        public readonly string $bookingCode,
        public readonly ?string $reason,
        public readonly string $retryUrl,
    ) {}

    public function build(): self
    {
        return $this
            ->subject('Payment Failed - SJT Travel')
            ->view('emails.payment-failed')
            ->text('emails.payment-failed-text')
            ->with(['name' => $this->name, 'bookingCode' => $this->bookingCode, 'reason' => $this->reason, 'retryUrl' => $this->retryUrl]);
    }
}
