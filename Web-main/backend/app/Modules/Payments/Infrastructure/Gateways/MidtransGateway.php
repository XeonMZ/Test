<?php

namespace App\Modules\Payments\Infrastructure\Gateways;

use App\Modules\Payments\Domain\Entities\PaymentRecord;
use App\Modules\Payments\Domain\Repositories\PaymentGateway;
use RuntimeException;

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
            (string) getenv('MIDTRANS_SERVER_KEY'),
            (string) getenv('MIDTRANS_CLIENT_KEY'),
            filter_var(getenv('MIDTRANS_SANDBOX') ?: true, FILTER_VALIDATE_BOOL),
        );
    }

    public function createCharge(PaymentRecord $payment): array
    {
        return match ($payment->method) {
            'snap' => ['redirect_url' => $this->baseUrl() . '/snap/v1/transactions/' . $payment->uuid, 'reference' => $payment->uuid],
            'qris' => ['qr_string' => 'midtrans-qris://' . $payment->uuid, 'reference' => $payment->uuid],
            'bank_transfer', 'va' => ['va_number' => '8808' . substr(preg_replace('/\D/', '', $payment->uuid), 0, 8), 'reference' => $payment->uuid],
            default => throw new RuntimeException('Unsupported Midtrans payment method.'),
        };
    }

    public function verifyWebhook(array $payload): bool
    {
        $signature = (string) ($payload['signature_key'] ?? '');
        $orderId = (string) ($payload['order_id'] ?? '');
        $statusCode = (string) ($payload['status_code'] ?? '');
        $grossAmount = (string) ($payload['gross_amount'] ?? '');
        $expected = hash('sha512', $orderId . $statusCode . $grossAmount . $this->serverKey);

        return hash_equals($expected, $signature);
    }

    private function baseUrl(): string
    {
        return $this->sandbox ? 'https://app.sandbox.midtrans.com' : 'https://app.midtrans.com';
    }
}
