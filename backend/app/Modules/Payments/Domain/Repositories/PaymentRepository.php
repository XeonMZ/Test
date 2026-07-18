<?php

namespace App\Modules\Payments\Domain\Repositories;

use App\Modules\Payments\Domain\Entities\PaymentRecord;

interface PaymentRepository
{
    public function findByUuid(string $uuid): ?PaymentRecord;
    public function findByIdempotencyKey(string $idempotencyKey): ?PaymentRecord;
    /** @return list<PaymentRecord> */
    public function dueExpiring(int $minutes): array;
    /** @return list<PaymentRecord> */
    public function expiredPending(): array;
    public function hasProcessedWebhook(string $gatewayReference): bool;
    public function save(PaymentRecord $payment): PaymentRecord;
    public function markWebhookProcessed(string $gatewayReference, array $payload): void;
}
