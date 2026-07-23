<?php

declare(strict_types=1);

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Queue\SerializesModels;

/** Email Preview 5 — booking cancelled with refund status. */
final class BookingCancelledMail extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(
        public readonly string $name,
        public readonly string $bookingCode,
        public readonly ?string $reason,
        public readonly ?string $refundStatus,
        public readonly ?string $refundAmount,
    ) {}

    public function build(): self
    {
        return $this
            ->subject('Booking Cancelled - SJT Travel')
            ->view('emails.booking-cancelled')
            ->text('emails.booking-cancelled-text')
            ->with(['name' => $this->name, 'bookingCode' => $this->bookingCode, 'reason' => $this->reason, 'refundStatus' => $this->refundStatus, 'refundAmount' => $this->refundAmount]);
    }
}
