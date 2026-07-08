<?php

namespace App\Modules\Payments\Application\Services;

use App\Jobs\PaymentExpiredJob;
use App\Jobs\PaymentReminderJob;
use App\Models\ActivityLog;
use App\Models\Booking;
use App\Modules\Booking\Domain\ValueObjects\BookingStatus;
use App\Modules\Payments\Domain\Entities\PaymentRecord;
use App\Modules\Payments\Domain\Repositories\PaymentGateway;
use App\Modules\Payments\Domain\Repositories\PaymentRepository;
use App\Modules\Payments\Domain\ValueObjects\PaymentStatus;
use Illuminate\Database\DatabaseManager;
use Illuminate\Support\Str;

final class PaymentService
{
    public function __construct(
        private readonly PaymentRepository $payments,
        private readonly PaymentGateway $gateway,
        private readonly PaymentValidationService $validator,
        private readonly PaymentWebhookService $webhooks,
        private readonly DatabaseManager $db,
    ) {}

    /** @return array{payment: PaymentRecord, gateway: array<string, mixed>} */
    public function createPayment(string $bookingUuid, int $amount, string $method, string $idempotencyKey): array
    {
        return $this->db->transaction(function () use ($bookingUuid, $amount, $method, $idempotencyKey): array {
            $existing = $this->payments->findByIdempotencyKey($idempotencyKey);
            if ($existing !== null) {
                return ['payment' => $existing, 'gateway' => $existing->gatewayPayload + ['reference' => (string) $existing->gatewayReference]];
            }

            $booking = Booking::where('uuid', $bookingUuid)->lockForUpdate()->firstOrFail();
            $this->validator->validateCreate($booking, $method, $amount);
            $expiresAt = now()->addMinutes((int) config('payment.expiry_minutes', 15));
            $normalizedMethod = $method === 'va' ? 'bank_transfer' : $method;
            $payment = new PaymentRecord((string) Str::uuid(), $bookingUuid, $amount, $normalizedMethod, PaymentStatus::Pending, $idempotencyKey, null, $expiresAt);
            $gatewayPayload = $this->gateway->createCharge($payment);
            $payment = new PaymentRecord($payment->uuid, $bookingUuid, $amount, $normalizedMethod, PaymentStatus::Pending, $idempotencyKey, $gatewayPayload['reference'] ?? $payment->uuid, $expiresAt, null, null, $gatewayPayload);
            $saved = $this->payments->save($payment);
            $booking->update(['status' => BookingStatus::WaitingPayment->value, 'expires_at' => $expiresAt]);
            $booking->seatReservations()->where('status', 'locked')->update(['status' => 'waiting_payment', 'locked_until' => $expiresAt]);
            $this->log($booking, 'payment.created', ['payment_uuid' => $saved->uuid, 'method' => $normalizedMethod]);
            PaymentExpiredJob::dispatch($saved->uuid)->delay($expiresAt);
            PaymentReminderJob::dispatch($saved->uuid)->delay(now()->addMinutes(max(1, (int) config('payment.reminder_minutes', 10))));
            return ['payment' => $saved, 'gateway' => $gatewayPayload];
        });
    }

    public function expire(string $paymentUuid): ?PaymentRecord
    {
        $payment = $this->payments->findByUuid($paymentUuid);
        if ($payment === null || $payment->status !== PaymentStatus::Pending) return $payment;
        return $this->webhooks->forceStatus($payment, PaymentStatus::Expired, ['source' => 'expiry_job']);
    }

    private function log(Booking $booking, string $action, array $metadata = []): void
    {
        ActivityLog::create(['action' => $action, 'subject_type' => Booking::class, 'subject_id' => $booking->id, 'metadata' => ['booking_uuid' => $booking->uuid] + $metadata]);
    }
}
