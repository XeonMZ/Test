<?php

namespace App\Modules\Payments\Infrastructure\Repositories;

use App\Models\Payment as PaymentModel;
use App\Modules\Payments\Domain\Entities\PaymentRecord;
use App\Modules\Payments\Domain\Repositories\PaymentRepository;
use App\Modules\Payments\Domain\ValueObjects\PaymentStatus;
use Illuminate\Support\Facades\DB;

final class EloquentPaymentRepository implements PaymentRepository
{
    public function findByUuid(string $uuid): ?PaymentRecord
    {
        $model = PaymentModel::where('uuid', $uuid)->first();
        return $model ? $this->toEntity($model) : null;
    }

    public function findByIdempotencyKey(string $idempotencyKey): ?PaymentRecord
    {
        $model = PaymentModel::where('idempotency_key', $idempotencyKey)->first();
        return $model ? $this->toEntity($model) : null;
    }

    public function dueExpiring(int $minutes): array
    {
        return PaymentModel::where('status', PaymentStatus::Pending->value)
            ->whereBetween('expires_at', [now(), now()->addMinutes($minutes)])
            ->get()->map(fn (PaymentModel $payment): PaymentRecord => $this->toEntity($payment))->all();
    }

    public function expiredPending(): array
    {
        return PaymentModel::where('status', PaymentStatus::Pending->value)
            ->where('expires_at', '<=', now())
            ->get()->map(fn (PaymentModel $payment): PaymentRecord => $this->toEntity($payment))->all();
    }

    public function hasProcessedWebhook(string $gatewayReference): bool
    {
        return DB::table('payment_webhook_logs')->where('gateway_reference', $gatewayReference)->exists();
    }

    public function save(PaymentRecord $payment): PaymentRecord
    {
        $bookingId = DB::table('bookings')->where('uuid', $payment->bookingUuid)->value('id');
        PaymentModel::updateOrCreate(
            ['uuid' => $payment->uuid],
            [
                'booking_id' => $bookingId,
                'provider' => 'midtrans',
                'reference' => $payment->gatewayReference ?? $payment->uuid,
                'amount' => $payment->amount,
                'status' => $payment->status->value,
                'method' => $payment->method,
                'idempotency_key' => $payment->idempotencyKey,
                'gateway_reference' => $payment->gatewayReference ?? $payment->uuid,
                'expires_at' => $payment->expiresAt,
                'paid_at' => $payment->paidAt,
                'failed_at' => $payment->failedAt,
                'gateway_payload' => $payment->gatewayPayload,
            ]
        );

        return $this->findByUuid($payment->uuid) ?? $payment;
    }

    public function markWebhookProcessed(string $gatewayReference, array $payload): void
    {
        DB::table('payment_webhook_logs')->updateOrInsert(
            ['gateway_reference' => $gatewayReference],
            ['event_type' => (string)($payload['transaction_status'] ?? 'unknown'), 'payload' => json_encode($payload), 'processed_at' => now(), 'created_at' => now(), 'updated_at' => now()]
        );
    }

    private function toEntity(PaymentModel $model): PaymentRecord
    {
        return new PaymentRecord($model->uuid, $model->booking?->uuid ?? '', (int) $model->amount, $model->method ?? 'snap', PaymentStatus::from($model->status), $model->idempotency_key ?? $model->uuid, $model->gateway_reference ?? $model->reference, $model->expires_at, $model->paid_at, $model->failed_at, $model->gateway_payload ?? []);
    }
}
