<?php

namespace App\Modules\Payments\Application\Services;

use App\Jobs\PaymentNotificationJob;
use App\Models\ActivityLog;
use App\Models\Booking;
use App\Modules\Booking\Application\Services\BookingService;
use App\Modules\Payments\Application\StateMachines\PaymentStateMachine;
use App\Modules\Payments\Domain\Entities\PaymentRecord;
use App\Modules\Payments\Domain\Events\PaymentExpired;
use App\Modules\Payments\Domain\Events\PaymentFailed;
use App\Modules\Payments\Domain\Events\PaymentSucceeded;
use App\Modules\Payments\Domain\Repositories\PaymentGateway;
use App\Modules\Payments\Domain\Repositories\PaymentRepository;
use App\Modules\Payments\Domain\ValueObjects\PaymentStatus;
use RuntimeException;

final class PaymentWebhookService
{
    public function __construct(
        private readonly PaymentRepository $payments,
        private readonly PaymentGateway $gateway,
        private readonly PaymentStateMachine $states,
        private readonly BookingService $bookings,
    ) {}

    /** @param array<string, mixed> $payload */
    public function handle(array $payload): PaymentRecord
    {
        $reference = (string) ($payload['order_id'] ?? '');
        if ($reference === '') throw new RuntimeException('Missing webhook order_id.');
        if ($this->payments->hasProcessedWebhook($reference)) {
            $payment = $this->payments->findByUuid($reference);
            if ($payment === null) throw new RuntimeException('Processed webhook payment not found.');
            return $payment;
        }
        if (! $this->gateway->verifyWebhook($payload)) throw new RuntimeException('Invalid payment webhook signature.');
        $payment = $this->payments->findByUuid($reference) ?? throw new RuntimeException('Payment not found.');
        $updated = $this->forceStatus($payment, $this->mapStatus((string) ($payload['transaction_status'] ?? '')), $payload);
        $this->payments->markWebhookProcessed($reference, $payload);
        return $updated;
    }

    /** @param array<string, mixed> $payload */
    public function forceStatus(PaymentRecord $payment, PaymentStatus $next, array $payload = []): PaymentRecord
    {
        if ($payment->status === $next) return $payment;
        $this->states->assertCanTransition($payment->status, $next);
        $updated = new PaymentRecord($payment->uuid, $payment->bookingUuid, $payment->amount, $payment->method, $next, $payment->idempotencyKey, $payment->gatewayReference, $payment->expiresAt, $next === PaymentStatus::Paid ? now() : $payment->paidAt, in_array($next, [PaymentStatus::Failed, PaymentStatus::Expired], true) ? now() : $payment->failedAt, $payment->gatewayPayload + ['last_webhook' => $payload]);
        $this->payments->save($updated);
        $booking = Booking::where('uuid', $payment->bookingUuid)->first();
        if ($booking) {
            ActivityLog::create(['action' => 'payment.'.$next->value, 'subject_type' => Booking::class, 'subject_id' => $booking->id, 'metadata' => ['booking_uuid' => $booking->uuid, 'payment_uuid' => $payment->uuid]]);
            if ($next === PaymentStatus::Paid) {
                PaymentSucceeded::dispatch($payment->uuid, $booking->uuid);
                $this->bookings->confirmBooking($booking->uuid);
            } elseif (in_array($next, [PaymentStatus::Failed, PaymentStatus::Expired], true)) {
                ($next === PaymentStatus::Expired ? PaymentExpired::class : PaymentFailed::class)::dispatch($payment->uuid, $booking->uuid);
                $this->bookings->expireBooking($booking->uuid);
            }
            PaymentNotificationJob::dispatch($booking->uuid, $next->value);
        }
        return $updated;
    }

    private function mapStatus(string $gatewayStatus): PaymentStatus
    {
        return match ($gatewayStatus) {
            'settlement', 'capture' => PaymentStatus::Paid,
            'deny', 'cancel', 'failure' => PaymentStatus::Failed,
            'expire' => PaymentStatus::Expired,
            'refund' => PaymentStatus::Refunded,
            'partial_refund' => PaymentStatus::PartialRefunded,
            default => PaymentStatus::Pending,
        };
    }
}
