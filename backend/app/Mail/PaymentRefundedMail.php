<?php

declare(strict_types=1);

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Queue\SerializesModels;

/** Refund processed notice. */
final class PaymentRefundedMail extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(
        public readonly string $name,
        public readonly string $bookingCode,
        public readonly string $amount,
    ) {}

    public function build(): self
    {
        return $this
            ->subject('Refund Processed - SJT Travel')
            ->view('emails.payment-refunded')
            ->text('emails.payment-refunded-text')
            ->with(['name' => $this->name, 'bookingCode' => $this->bookingCode, 'amount' => $this->amount]);
    }
}
