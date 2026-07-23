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
 * Automatic online payment for tour package bookings, including down payment.
 *
 * Reuses the SAME injected PaymentGateway (Midtrans in production, Beta in
 * dev) and the SAME webhook signature verification as travel bookings. The
 * gateway order_id is stored on the package_bookings row (the shared
 * `payments` table is FK-bound to travel bookings, so we do not overload it).
 *
 * A DP booking produces TWO independent gateway orders over its lifetime:
 *
 *   payment_*    — the first instalment (the DP itself, or the full amount)
 *   settlement_* — the remainder, created later by settle()
 *
 * They are kept in separate column sets rather than overwriting one another
 * so both references survive for reconciliation, and so a late webhook for
 * the DP order can never be mistaken for the settlement.
 */
final class PackagePaymentService
{
    private const METHODS = ['snap', 'qris', 'bank_transfer'];

    public function __construct(private readonly PaymentGateway $gateway) {}

    /**
     * Create (or reuse) the FIRST gateway charge — the DP for a DP booking,
     * otherwise the whole amount.
     *
     * @return array{payment: array{uuid: string, method: string, reference: ?string, expires_at: ?string, payload: array<string, mixed>, amount: float, kind: string}}
     */
    public function charge(PackageBooking $booking, string $method): array
    {
        abort_unless(in_array($method, self::METHODS, true), 422, 'Metode pembayaran tidak didukung.');

        return DB::transaction(function () use ($booking, $method): array {
            $locked = PackageBooking::whereKey($booking->id)->lockForUpdate()->firstOrFail();

            // Re-checked INSIDE the lock. Checking only before it leaves a
            // window where two concurrent requests both pass and the second
            // overwrites the first order id, orphaning it at the gateway.
            abort_unless($locked->status === 'waiting_payment', 422, 'Booking tidak dalam status menunggu pembayaran.');

            // Idempotent: reuse an unexpired existing charge for the same method.
            if ($locked->payment_uuid && $locked->payment_method === $method
                && $locked->payment_expires_at && $locked->payment_expires_at->isFuture()) {
                return ['payment' => $this->present($locked, 'first')];
            }

            $amount = $locked->amountDueNow();
            abort_if($amount <= 0, 422, 'Tidak ada tagihan yang harus dibayar untuk booking ini.');

            $uuid = (string) Str::uuid();
            $expiresAt = now()->addMinutes((int) config('payment.expiry_minutes', 15));
            $record = new PaymentRecord($uuid, $booking->uuid, (int) round($amount), $method, PaymentStatus::Pending, $uuid, null, $expiresAt);

            $payload = $this->gateway->createCharge($record);

            $locked->forceFill([
                'payment_uuid' => $uuid,
                'payment_method' => $method,
                'payment_reference' => $payload['reference'] ?? $uuid,
                'payment_payload' => $payload,
                'payment_expires_at' => $expiresAt,
            ])->save();

            return ['payment' => $this->present($locked->refresh(), 'first')];
        });
    }

    /**
     * Create (or reuse) the SETTLEMENT charge for the remainder of a DP booking.
     *
     * @return array{payment: array{uuid: string, method: string, reference: ?string, expires_at: ?string, payload: array<string, mixed>, amount: float, kind: string}}
     */
    public function settle(PackageBooking $booking, string $method): array
    {
        abort_unless(in_array($method, self::METHODS, true), 422, 'Metode pembayaran tidak didukung.');

        return DB::transaction(function () use ($booking, $method): array {
            $locked = PackageBooking::whereKey($booking->id)->lockForUpdate()->firstOrFail();

            abort_unless($locked->status === 'paid', 422, 'Pelunasan hanya bisa dilakukan setelah DP terkonfirmasi.');
            abort_if($locked->is_settled, 422, 'Booking sudah lunas — tidak ada sisa pembayaran.');

            if ($locked->settlement_uuid && $locked->settlement_method === $method
                && $locked->settlement_expires_at && $locked->settlement_expires_at->isFuture()) {
                return ['payment' => $this->present($locked, 'settlement')];
            }

            $amount = $locked->outstanding_amount;
            $uuid = (string) Str::uuid();
            $expiresAt = now()->addMinutes((int) config('payment.expiry_minutes', 15));
            $record = new PaymentRecord($uuid, $booking->uuid, (int) round($amount), $method, PaymentStatus::Pending, $uuid, null, $expiresAt);

            $payload = $this->gateway->createCharge($record);

            $locked->forceFill([
                'settlement_uuid' => $uuid,
                'settlement_method' => $method,
                'settlement_reference' => $payload['reference'] ?? $uuid,
                'settlement_payload' => $payload,
                'settlement_expires_at' => $expiresAt,
            ])->save();

            return ['payment' => $this->present($locked->refresh(), 'settlement')];
        });
    }

    /**
     * Apply a verified gateway webhook.
     *
     * The caller (webhook endpoint) must have already run
     * PaymentGateway::verifyWebhook() on the raw payload. The order id tells
     * us which of the two charges it belongs to, so a retried DP webhook can
     * never be credited as a settlement.
     *
     * @param array<string, mixed> $payload
     */
    public function settleFromWebhook(string $orderId, array $payload): bool
    {
        $status = (string) ($payload['transaction_status'] ?? '');
        $paid = in_array($status, ['capture', 'settlement'], true);
        $failed = in_array($status, ['deny', 'cancel', 'expire', 'failure'], true);

        $booking = PackageBooking::where('payment_uuid', $orderId)->first();
        $isFirst = $booking !== null;

        if ($booking === null) {
            $booking = PackageBooking::where('settlement_uuid', $orderId)->first();
        }
        if ($booking === null) {
            return false;
        }

        if ($paid) {
            return $isFirst
                ? $this->applyFirstPayment($booking->id)
                : $this->applySettlement($booking->id);
        }

        if ($failed && $isFirst) {
            PackageBooking::whereKey($booking->id)->where('status', 'waiting_verification')
                ->update(['status' => 'waiting_payment']);
        }

        return false;
    }

    /**
     * Credit the first instalment. Guarded by a status filter so webhook
     * retries are idempotent — the second delivery matches nothing.
     */
    public function applyFirstPayment(int $bookingId): bool
    {
        return DB::transaction(function () use ($bookingId): bool {
            $locked = PackageBooking::whereKey($bookingId)->lockForUpdate()->first();
            if ($locked === null || ! in_array($locked->status, ['waiting_payment', 'waiting_verification'], true)) {
                return false;
            }

            $received = $locked->is_dp && $locked->dp_amount !== null
                ? round((float) $locked->dp_amount, 2)
                : round((float) $locked->amount, 2);

            $locked->forceFill([
                'status' => 'paid',
                'paid_at' => now(),
                'paid_amount' => $received,
                'settlement_claimed_at' => null,
            ])->save();

            // A full-payment booking is settled the moment it is paid.
            if ($locked->refresh()->is_settled) {
                $locked->forceFill(['settled_at' => now()])->save();
            }

            return true;
        });
    }

    /** Credit the remainder. Idempotent: a settled booking is left alone. */
    public function applySettlement(int $bookingId): bool
    {
        return DB::transaction(function () use ($bookingId): bool {
            $locked = PackageBooking::whereKey($bookingId)->lockForUpdate()->first();
            if ($locked === null || $locked->status !== 'paid' || $locked->is_settled) {
                return false;
            }

            $locked->forceFill([
                'paid_amount' => round((float) $locked->amount, 2),
                'settled_at' => now(),
                'settlement_claimed_at' => null,
            ])->save();

            return true;
        });
    }

    /**
     * @return array{uuid: string, method: string, reference: ?string, expires_at: ?string, payload: array<string, mixed>, amount: float, kind: string}
     */
    private function present(PackageBooking $booking, string $kind): array
    {
        $settlement = $kind === 'settlement';

        return [
            'uuid' => (string) ($settlement ? $booking->settlement_uuid : $booking->payment_uuid),
            'method' => (string) ($settlement ? $booking->settlement_method : $booking->payment_method),
            'reference' => $settlement ? $booking->settlement_reference : $booking->payment_reference,
            'expires_at' => ($settlement ? $booking->settlement_expires_at : $booking->payment_expires_at)?->toIso8601String(),
            'payload' => is_array($settlement ? $booking->settlement_payload : $booking->payment_payload)
                ? ($settlement ? $booking->settlement_payload : $booking->payment_payload)
                : [],
            'amount' => $settlement ? $booking->outstanding_amount : $booking->amountDueNow(),
            'kind' => $kind,
        ];
    }
}
