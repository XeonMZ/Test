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
    public function createPayment(string $bookingUuid, int $amount, string $method, string $idempotencyKey, string $paymentType = 'full'): array
    {
        return $this->db->transaction(function () use ($bookingUuid, $amount, $method, $idempotencyKey, $paymentType): array {
            $existing = $this->payments->findByIdempotencyKey($idempotencyKey);
            if ($existing !== null) {
                return ['payment' => $existing, 'gateway' => $existing->gatewayPayload + ['reference' => (string) $existing->gatewayReference]];
            }

            $booking = Booking::where('uuid', $bookingUuid)->lockForUpdate()->firstOrFail();
            // Map UI-facing method names onto the gateway's canonical set before
            // validating, so every method the frontend offers is actually payable.
            $normalizedMethod = match ($method) {
                'va', 'virtual_account' => 'bank_transfer',
                'ewallet' => 'snap',
                default => $method,
            };
            if ($paymentType === 'settlement') {
                // Settlement of a DP booking: the booking is already paid/
                // confirmed at DP time, so the standard "payable status" rule
                // does not apply — only method + amount are validated here.
                abort_unless(in_array($normalizedMethod, ['snap', 'qris', 'bank_transfer', 'va'], true), 422, 'Metode pembayaran tidak didukung.');
                abort_unless($amount === (int) $booking->amount, 422, 'Nominal pembayaran tidak sesuai booking.');
            } else {
                $this->validator->validateCreate($booking, $normalizedMethod, $amount);
            }

            // ---- Admin fee + tax (configurable via System Settings) ----
            // payment_admin_fees: {"bank_transfer":{"type":"fixed","value":4000},
            //                      "snap":{"type":"percent","value":2}}
            // payment_tax_percent: e.g. 0.7 — applied on base fare.
            // Applied at this single choke point so booking pricing logic is
            // untouched; the full breakdown is persisted in gateway_payload
            // (key "pricing") so the invoice email reads STORED figures.
            $fees = $this->settingJson('payment_admin_fees');
            $rule = $fees[$normalizedMethod] ?? $fees['default'] ?? null;
            $adminFee = 0.0;
            if (is_array($rule)) {
                $adminFee = ($rule['type'] ?? 'fixed') === 'percent'
                    ? round($amount * ((float) ($rule['value'] ?? 0)) / 100)
                    : (float) ($rule['value'] ?? 0);
            }
            $taxPercent = (float) ($this->settingScalar('payment_tax_percent') ?? 0);
            $tax = round($amount * $taxPercent / 100);
            $chargeTotal = (int) round($amount + $adminFee + $tax);

            // ---- Down Payment (configurable, default disabled) ----
            // payment_dp_enabled=true + payment_type=dp charges only the DP
            // percentage (payment_dp_percent, default 70) now; the remainder
            // is collected by the /settlement endpoint as a second payment.
            // Booking pricing/state machines are untouched — DP status is
            // derived from sum(paid payments) vs the booking total.
            $dpApplied = false;
            if ($paymentType === 'settlement') {
                $alreadyPaid = (int) \Illuminate\Support\Facades\DB::table('payments')->where('booking_id', $booking->id)->where('status', 'paid')->whereNull('deleted_at')->sum('amount');
                abort_if($alreadyPaid <= 0, 422, 'Belum ada pembayaran DP untuk booking ini.');
                $remaining = $chargeTotal - $alreadyPaid;
                abort_if($remaining <= 0, 422, 'Booking sudah lunas — tidak ada sisa pelunasan.');
                $chargeTotal = $remaining;
            } elseif ($paymentType === 'dp') {
                abort_unless((bool) ($this->settingScalar('payment_dp_enabled') ?? false), 422, 'Pembayaran DP sedang tidak tersedia.');
                $dpPercent = max(1, min(99, (float) ($this->settingScalar('payment_dp_percent') ?? 70)));
                $chargeTotal = (int) round($chargeTotal * $dpPercent / 100);
                $dpApplied = true;
            }
            $pricing = ['base_fare' => $amount, 'admin_fee' => $adminFee, 'tax_percent' => $taxPercent, 'tax' => $tax, 'total' => $chargeTotal, 'payment_type' => $paymentType, 'dp' => $dpApplied];

            $expiresAt = now()->addMinutes((int) config('payment.expiry_minutes', 15));
            $payment = new PaymentRecord((string) Str::uuid(), $bookingUuid, $chargeTotal, $normalizedMethod, PaymentStatus::Pending, $idempotencyKey, null, $expiresAt);
            $gatewayPayload = $this->gateway->createCharge($payment) + ['pricing' => $pricing];
            $payment = new PaymentRecord($payment->uuid, $bookingUuid, $chargeTotal, $normalizedMethod, PaymentStatus::Pending, $idempotencyKey, $gatewayPayload['reference'] ?? $payment->uuid, $expiresAt, null, null, $gatewayPayload);
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

    /** @return array<string, mixed> */
    private function settingJson(string $key): array
    {
        $value = \App\Models\SystemSetting::query()->where('key', $key)->value('value');
        if (is_array($value)) {
            return isset($value['value']) && is_array($value['value']) ? $value['value'] : $value;
        }
        $decoded = json_decode((string) $value, true);
        return is_array($decoded) ? $decoded : [];
    }

    private function settingScalar(string $key): mixed
    {
        $value = \App\Models\SystemSetting::query()->where('key', $key)->value('value');
        return is_array($value) ? ($value['value'] ?? null) : $value;
    }
}
