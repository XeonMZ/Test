<?php

namespace App\Modules\Payments\Infrastructure\Gateways;

use App\Modules\Payments\Domain\Entities\PaymentRecord;
use App\Modules\Payments\Domain\Repositories\PaymentGateway;

/**
 * Sandbox/demo gateway used when no real payment provider is configured.
 *
 * Security: webhook verification here uses a shared secret so that even the
 * demo gateway cannot be spoofed by anonymous callers. In production this
 * gateway refuses webhooks entirely — a real provider (e.g. Midtrans) must be
 * configured, otherwise anyone could forge a "paid" callback and mint tickets.
 */
final class BetaPaymentGateway implements PaymentGateway
{
    public function createCharge(PaymentRecord $payment): array
    {
        return match ($payment->method) {
            'snap' => ['redirect_url' => url('/payment/beta/'.$payment->uuid), 'reference' => $payment->uuid],
            'qris' => ['qr_string' => 'sjt-beta-qris://'.$payment->uuid, 'reference' => $payment->uuid],
            'bank_transfer', 'va' => ['va_number' => '0000'.substr(preg_replace('/\D/', '', $payment->uuid), 0, 8), 'reference' => $payment->uuid],
            default => ['reference' => $payment->uuid],
        };
    }

    /** @param array<string, mixed> $payload */
    public function verifyWebhook(array $payload): bool
    {
        // Never accept unverified webhooks in production.
        if (app()->environment('production')) {
            return false;
        }

        // In non-production, require a shared secret so the endpoint still
        // cannot be triggered by an anonymous attacker who guesses an order_id.
        $secret = (string) config('payment.beta.webhook_secret', '');
        if ($secret === '') {
            return false;
        }

        $provided = (string) ($payload['beta_signature'] ?? '');
        $expected = hash_hmac('sha256', (string) ($payload['order_id'] ?? '').(string) ($payload['transaction_status'] ?? ''), $secret);

        return hash_equals($expected, $provided);
    }
}
