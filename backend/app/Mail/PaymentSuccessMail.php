<?php

declare(strict_types=1);

namespace App\Mail;

use App\Models\Booking;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Queue\SerializesModels;

/**
 * Email Preview 3 — invoice sent only when payment status becomes SUCCESS.
 * All values are read from the existing Booking/Payment/Schedule relations —
 * pricing is whatever BookingService already computed; nothing is re-derived
 * beyond presenting the base-fare × seats vs. final-amount difference as the
 * discount line (the only breakdown the schema stores).
 */
final class PaymentSuccessMail extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(public readonly int $bookingId) {}

    public function build(): self
    {
        $booking = Booking::with([
            'customer:id,user_id,phone',
            'customer.user:id,name,email',
            'schedule.route:id,origin,destination',
            'schedule.vehicle:id,brand,plate_number',
            'schedule.driver.user:id,name',
            'seatReservations.vehicleSeat:id,seat_number',
            'passengers:id,booking_id,name',
            'payment:id,booking_id,uuid,method,provider,status,amount,paid_at,gateway_payload',
        ])->findOrFail($this->bookingId);

        $idr = fn (float|int|string|null $v): string => 'Rp'.number_format((float) ($v ?? 0), 0, ',', '.');
        $seatCount = max(1, $booking->seatReservations->count());
        $baseFare = (float) ($booking->schedule?->base_fare ?? 0);
        $subtotal = $baseFare > 0 ? $baseFare * $seatCount : (float) $booking->amount;
        $discount = max(0.0, $subtotal - (float) $booking->amount);
        $departure = $booking->schedule?->departure_at;

        $breakdown = [['label' => "Tarif ({$seatCount} kursi × ".$idr($baseFare > 0 ? $baseFare : (float) $booking->amount / $seatCount).')', 'value' => $idr($subtotal)]];
        if ($discount > 0) {
            $breakdown[] = ['label' => 'Diskon / Promo', 'value' => '- '.$idr($discount)];
        }
        // Admin fee & tax: read the STORED pricing snapshot persisted by
        // PaymentService at charge time (gateway_payload.pricing) — never
        // recomputed, so the invoice always matches what was billed.
        $payload = $booking->payment?->gateway_payload;
        $pricing = is_array($payload) ? ($payload['pricing'] ?? []) : (json_decode((string) $payload, true)['pricing'] ?? []);
        if ((float) ($pricing['admin_fee'] ?? 0) > 0) {
            $breakdown[] = ['label' => 'Biaya Admin', 'value' => $idr($pricing['admin_fee'])];
        }
        if ((float) ($pricing['tax'] ?? 0) > 0) {
            $breakdown[] = ['label' => 'Pajak ('.($pricing['tax_percent'] ?? 0).'%)', 'value' => $idr($pricing['tax'])];
        }

        $inv = [
            'invoice_number' => 'INV-'.strtoupper(substr((string) ($booking->payment?->uuid ?? $booking->uuid), 0, 8)).'-'.$booking->id,
            'booking_code' => $booking->code,
            'payment_method' => ucwords(str_replace('_', ' ', (string) ($booking->payment?->method ?? $booking->payment?->provider ?? '—'))),
            'passenger_name' => $booking->passengers->first()?->name ?? $booking->customer?->user?->name ?? 'Pelanggan',
            'phone' => $booking->customer?->phone ?? '—',
            'pickup' => $booking->pickup_label ?: ($booking->schedule?->route?->origin ?? '—'),
            'destination' => $booking->drop_label ?: ($booking->schedule?->route?->destination ?? '—'),
            'departure_date' => $departure?->translatedFormat('d F Y') ?? '—',
            'departure_time' => $departure?->format('H:i').' WIB',
            'seats' => $booking->seatReservations->map(fn ($r) => $r->vehicleSeat?->seat_number)->filter()->implode(', ') ?: '—',
            'vehicle' => $booking->schedule?->vehicle ? trim(($booking->schedule->vehicle->brand ?? '').' · '.($booking->schedule->vehicle->plate_number ?? '')) : '—',
            'driver' => $booking->schedule?->driver?->user?->name,
            'breakdown' => $breakdown,
            'grand_total' => $idr($booking->payment?->amount ?? $booking->amount),
            'booking_url' => rtrim((string) env('FRONTEND_URL', ''), '/').'/customer/bookings/'.$booking->uuid,
        ];

        return $this
            ->subject('Payment Successful - Booking Confirmed')
            ->view('emails.payment-success')
            ->text('emails.payment-success-text')
            ->with(['inv' => $inv]);
    }
}
