<?php

declare(strict_types=1);

namespace App\Listeners;

use App\Mail\BookingCancelledMail;
use App\Mail\PaymentFailedMail;
use App\Mail\PaymentSuccessMail;
use App\Models\Booking;
use App\Modules\Booking\Domain\Events\BookingCancelled;
use App\Modules\Payments\Domain\Events\PaymentExpired;
use App\Modules\Payments\Domain\Events\PaymentFailed;
use App\Modules\Payments\Domain\Events\PaymentSucceeded;
use App\Support\Mail\TransactionalMailer;

/**
 * Payment/booking lifecycle emails, hooked on the EXISTING domain events that
 * PaymentWebhookService and BookingService already dispatch — no business flow
 * touched. Each send is deduplicated by the payment/booking uuid + status, so
 * webhook retries can never produce duplicate emails.
 */
final class SendBookingLifecycleEmails
{
    public function __construct(private readonly TransactionalMailer $mailer) {}

    public function handlePaymentSucceeded(PaymentSucceeded $event): void
    {
        $booking = $this->booking($event->bookingUuid);
        if ($booking === null || ! $this->email($booking)) {
            return;
        }
        // Invoice fires ONLY on SUCCESS, exactly once per payment.
        $this->mailer->queue(
            'payment_success',
            $this->email($booking),
            'Payment Successful - Booking Confirmed',
            new PaymentSuccessMail($booking->id),
            "payment:{$event->paymentUuid}",
            $booking->customer?->user_id,
            ['booking_code' => $booking->code],
        );
    }

    public function handlePaymentFailed(PaymentFailed|PaymentExpired $event): void
    {
        $booking = $this->booking($event->bookingUuid);
        if ($booking === null || ! $this->email($booking)) {
            return;
        }
        $expired = $event instanceof PaymentExpired;
        $this->mailer->queue(
            'payment_failed',
            $this->email($booking),
            'Payment Failed - SJT Travel',
            new PaymentFailedMail(
                $booking->customer?->user?->name ?? 'Pelanggan',
                $booking->code,
                $expired ? 'Waktu pembayaran habis (expired)' : 'Pembayaran ditolak oleh penyedia pembayaran',
                rtrim((string) env('FRONTEND_URL', ''), '/').'/customer/bookings/'.$booking->uuid,
            ),
            "payment:{$event->paymentUuid}:".($expired ? 'expired' : 'failed'),
            $booking->customer?->user_id,
            ['booking_code' => $booking->code],
        );
    }

    public function handleBookingCancelled(BookingCancelled $event): void
    {
        $booking = $this->booking($event->booking->uuid);
        if ($booking === null || ! $this->email($booking)) {
            return;
        }
        $payment = $booking->payment;
        $wasPaid = in_array($payment?->status, ['paid', 'refunded', 'partial_refunded'], true);
        $this->mailer->queue(
            'booking_cancelled',
            $this->email($booking),
            'Booking Cancelled - SJT Travel',
            new BookingCancelledMail(
                $booking->customer?->user?->name ?? 'Pelanggan',
                $booking->code,
                null,
                $wasPaid ? ($payment?->status === 'refunded' ? 'Refund diproses' : 'Refund sedang ditinjau') : null,
                $wasPaid ? 'Rp'.number_format((float) ($payment?->amount ?? 0), 0, ',', '.') : null,
            ),
            "booking:{$booking->uuid}:cancelled",
            $booking->customer?->user_id,
            ['booking_code' => $booking->code],
        );
    }

    private function booking(string $uuid): ?Booking
    {
        return Booking::with(['customer:id,user_id', 'customer.user:id,name,email', 'payment:id,booking_id,status,amount'])
            ->where('uuid', $uuid)
            ->first();
    }

    private function email(Booking $booking): string
    {
        return (string) ($booking->customer?->user?->email ?? '');
    }
}
