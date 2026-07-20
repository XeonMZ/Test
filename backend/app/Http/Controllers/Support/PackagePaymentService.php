<?php

declare(strict_types=1);

namespace App\Http\Controllers\Support;

use App\Models\PackageBooking;
use App\Modules\Payments\Domain\Entities\PaymentRecord;
use App\Modules\Payments\Domain\Repositories\PaymentGateway;
use App\Modules\Payments\Domain\ValueObjects\PaymentStatus;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

/**
 * Automatic online payment for tour package bookings.
 *
 * Reuses the SAME injected PaymentGateway (Midtrans in production, Beta in
 * dev) and the SAME webhook signature verification as travel bookings. The
 * gateway order_id is the package payment_uuid, stored on the package_bookings
 * row (the shared `payments` table is FK-bound to travel bookings, so we do
 * not overload it). Manual transfer verification stays fully supported; this
 * is an additional path, not a replacement.
 */
final class PackagePaymentService
{
    public function __construct(private readonly PaymentGateway $gateway) {}

    /**
     * Create (or reuse) a gateway charge for a waiting_payment package booking.
     *
     * @return array{payment: array{uuid: string, method: string, reference: ?string, expires_at: ?string, payload: array<string, mixed>}}
     */
    public function charge(PackageBooking $booking, string $method): array
    {
        abort_unless(in_array($method, ['snap', 'qris', 'bank_transfer'], true), 422, 'Metode pembayaran tidak didukung.');
        abort_unless($booking->status === 'waiting_payment', 422, 'Booking tidak dalam status menunggu pembayaran.');

        return DB::transaction(function () use ($booking, $method): array {
            $locked = PackageBooking::whereKey($booking->id)->lockForUpdate()->firstOrFail();

            // Idempotent: reuse an unexpired existing charge for the same method.
            if ($locked->payment_uuid && $locked->payment_method === $method
                && $locked->payment_expires_at && $locked->payment_expires_at->isFuture()) {
                return ['payment' => $this->present($locked)];
            }

            $uuid = (string) Str::uuid();
            $expiresAt = now()->addMinutes((int) config('payment.expiry_minutes', 15));
            $record = new PaymentRecord($uuid, $booking->uuid, (int) round((float) $locked->amount), $method, PaymentStatus::Pending, $uuid, null, $expiresAt);

            // Same contract, same gateway instance as travel payments.
            $payload = $this->gateway->createCharge($record);

            $locked->forceFill([
                'payment_uuid' => $uuid,
                'payment_method' => $method,
                'payment_reference' => $payload['reference'] ?? $uuid,
                'payment_payload' => $payload,
                'payment_expires_at' => $expiresAt,
            ])->save();

            return ['payment' => $this->present($locked->refresh())];
        });
    }

    /**
     * Settle a package booking from a verified gateway webhook.
     * The caller (webhook endpoint) must have already run
     * PaymentGateway::verifyWebhook() on the raw payload.
     *
     * @param array<string, mixed> $payload
     */
    public function settleFromWebhook(string $orderId, array $payload): bool
    {
        $status = (string) ($payload['transaction_status'] ?? '');
        $booking = PackageBooking::where('payment_uuid', $orderId)->first();
        if ($booking === null) {
            return false;
        }

        $paid = in_array($status, ['capture', 'settlement'], true);
        $failed = in_array($status, ['deny', 'cancel', 'expire', 'failure'], true);

        if ($paid) {
            // Atomic: only transition a still-unpaid booking (webhook retries safe).
            $updated = PackageBooking::whereKey($booking->id)->whereIn('status', ['waiting_payment', 'waiting_verification'])
                ->update(['status' => 'paid', 'paid_at' => now()]);
            return $updated > 0;
        }
        if ($failed) {
            PackageBooking::whereKey($booking->id)->where('status', 'waiting_verification')
                ->update(['status' => 'waiting_payment']);
        }
        return false;
    }

    /** @return array{uuid: string, method: string, reference: ?string, expires_at: ?string, payload: array<string, mixed>} */
    private function present(PackageBooking $booking): array
    {
        return [
            'uuid' => (string) $booking->payment_uuid,
            'method' => (string) $booking->payment_method,
            'reference' => $booking->payment_reference,
            'expires_at' => $booking->payment_expires_at?->toIso8601String(),
            'payload' => is_array($booking->payment_payload) ? $booking->payment_payload : [],
        ];
    }
}
