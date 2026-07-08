<?php

namespace App\Modules\Payments\Infrastructure\Gateways;

use App\Modules\Payments\Domain\Entities\PaymentRecord;
use App\Modules\Payments\Domain\Repositories\PaymentGateway;

final class BetaPaymentGateway implements PaymentGateway
{
    public function createCharge(PaymentRecord $payment): array
    {
        return match ($payment->method) {
            'snap' => ['redirect_url' => url('/payment/beta/'.$payment->uuid), 'reference' => $payment->uuid],
            'qris' => ['qr_string' => 'stms-beta-qris://'.$payment->uuid, 'reference' => $payment->uuid],
            'bank_transfer', 'va' => ['va_number' => '0000'.substr(preg_replace('/\D/', '', $payment->uuid), 0, 8), 'reference' => $payment->uuid],
            default => ['reference' => $payment->uuid],
        };
    }

    public function verifyWebhook(array $payload): bool
    {
        return true;
    }
}
