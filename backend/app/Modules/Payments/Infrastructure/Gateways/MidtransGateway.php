<?php

namespace App\Modules\Payments\Infrastructure\Gateways;

use App\Modules\Payments\Domain\Entities\PaymentRecord;
use App\Modules\Payments\Domain\Repositories\PaymentGateway;
use Illuminate\Support\Facades\Http;
use RuntimeException;

/**
 * Real Midtrans integration via the Snap API.
 *
 * createCharge() creates a Snap transaction (one integration path for QRIS,
 * bank transfer / VA, e-wallets, and cards) and returns the Snap token plus
 * redirect_url the customer completes payment on. Webhooks are verified with
 * Midtrans' documented sha512(order_id + status_code + gross_amount + serverKey)
 * signature.
 */
final class MidtransGateway implements PaymentGateway
{
    public function __construct(
        private readonly string $serverKey,
        private readonly string $clientKey,
        private readonly bool $sandbox = true,
    ) {}

    public static function fromEnvironment(): self
    {
        return new self(
            (string) config('payment.midtrans.server_key', ''),
            (string) config('payment.midtrans.client_key', ''),
            (bool) config('payment.midtrans.sandbox', true),
        );
    }

    /** @return array<string, mixed> */
    public function createCharge(PaymentRecord $payment): array
    {
        if ($this->serverKey === '') {
            throw new RuntimeException('Midtrans server key is not configured (MIDTRANS_SERVER_KEY).');
        }

        $body = [
            'transaction_details' => [
                'order_id' => $payment->uuid,
                'gross_amount' => $payment->amount,
            ],
        ];

        $enabledPayments = match ($payment->method) {
            'qris' => ['qris', 'gopay', 'shopeepay'],
            'bank_transfer' => ['bank_transfer', 'echannel', 'permata'],
            default => null, // snap: let Midtrans offer every enabled channel
        };
        if ($enabledPayments !== null) {
            $body['enabled_payments'] = $enabledPayments;
        }

        $response = Http::withBasicAuth($this->serverKey, '')
            ->acceptJson()
            ->timeout(15)
            ->post($this->snapBaseUrl().'/snap/v1/transactions', $body);

        if ($response->failed()) {
            $messages = implode(' ', (array) $response->json('error_messages', ['HTTP '.$response->status()]));
            throw new RuntimeException('Midtrans charge failed: '.$messages);
        }

        return [
            'reference' => $payment->uuid,
            'snap_token' => (string) $response->json('token'),
            'redirect_url' => (string) $response->json('redirect_url'),
        ];
    }

    /** @param array<string, mixed> $payload */
    public function verifyWebhook(array $payload): bool
    {
        $signature = (string) ($payload['signature_key'] ?? '');
        $orderId = (string) ($payload['order_id'] ?? '');
        $statusCode = (string) ($payload['status_code'] ?? '');
        $grossAmount = (string) ($payload['gross_amount'] ?? '');
        $expected = hash('sha512', $orderId . $statusCode . $grossAmount . $this->serverKey);

        return hash_equals($expected, $signature);
    }

    private function snapBaseUrl(): string
    {
        return $this->sandbox ? 'https://app.sandbox.midtrans.com' : 'https://app.midtrans.com';
    }
}
