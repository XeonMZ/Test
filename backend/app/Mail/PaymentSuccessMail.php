<?php

declare(strict_types=1);

namespace App\Mail;

use App\Models\Booking;
use App\Support\Mail\EmailTemplate;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Queue\SerializesModels;

/**
 * Invoice, sent when a payment reaches SUCCESS.
 *
 * Money never gets recomputed here. Totals come from what was actually
 * charged (payment.amount) and the line breakdown from the pricing snapshot
 * PaymentService persisted on gateway_payload at charge time. If that
 * snapshot is missing the invoice degrades to the stored total rather than
 * inventing a breakdown — an invoice that quietly disagrees with the receipt
 * is worse than a terse one.
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
            'schedule:id,route_id,vehicle_id,driver_id,departure_at,arrival_at,base_fare',
            'schedule.route:id,code,origin,destination',
            'schedule.vehicle:id,brand,plate_number',
            'schedule.driver.user:id,name',
            'seatReservations:id,booking_id,passenger_id,vehicle_seat_id',
            'seatReservations.vehicleSeat:id,seat_number',
            'passengers:id,booking_id,name,identity_number',
            'payment:id,booking_id,uuid,method,provider,reference,status,amount,paid_at,gateway_payload',
        ])->findOrFail($this->bookingId);

        $idr = fn (float|int|string|null $v): string => 'Rp'.number_format((float) ($v ?? 0), 0, ',', '.');

        $payment = $booking->payment;
        $schedule = $booking->schedule;
        $departure = $schedule?->departure_at;
        $arrival = $schedule?->arrival_at;

        // ---- Seat / passenger manifest -------------------------------------
        // Pair each passenger with the seat actually reserved for them; fall
        // back to a bare seat list when reservations carry no passenger link.
        $seatByPassenger = $booking->seatReservations
            ->filter(fn ($r) => $r->passenger_id !== null)
            ->mapWithKeys(fn ($r) => [$r->passenger_id => $r->vehicleSeat?->seat_number]);

        $manifest = $booking->passengers->map(fn ($p) => [
            'name' => (string) $p->name,
            'identity' => $p->identity_number ? $this->maskIdentity((string) $p->identity_number) : null,
            'seat' => $seatByPassenger[$p->id] ?? null,
        ])->values()->all();

        $allSeats = $booking->seatReservations
            ->map(fn ($r) => $r->vehicleSeat?->seat_number)
            ->filter()
            ->values();

        // ---- Money ---------------------------------------------------------
        $seatCount = max(1, $booking->seatReservations->count());
        $charged = (float) ($payment?->amount ?? $booking->amount);
        $bookingTotal = (float) $booking->amount;
        $baseFare = (float) ($schedule?->base_fare ?? 0);
        $subtotal = $baseFare > 0 ? $baseFare * $seatCount : $bookingTotal;
        $discount = max(0.0, $subtotal - $bookingTotal);

        $unit = $baseFare > 0 ? $baseFare : ($seatCount > 0 ? $bookingTotal / $seatCount : $bookingTotal);
        $breakdown = [[
            'label' => "Tarif tiket ({$seatCount} kursi × ".$idr($unit).')',
            'value' => $idr($subtotal),
        ]];

        if ($discount > 0) {
            $breakdown[] = ['label' => 'Diskon / Promo', 'value' => '- '.$idr($discount)];
        }

        $payload = $payment?->gateway_payload;
        $pricing = is_array($payload)
            ? ($payload['pricing'] ?? [])
            : (is_array(json_decode((string) $payload, true)) ? (json_decode((string) $payload, true)['pricing'] ?? []) : []);
        $pricing = is_array($pricing) ? $pricing : [];

        if ((float) ($pricing['admin_fee'] ?? 0) > 0) {
            $breakdown[] = ['label' => 'Biaya Admin', 'value' => $idr($pricing['admin_fee'])];
        }
        if ((float) ($pricing['tax'] ?? 0) > 0) {
            $breakdown[] = ['label' => 'Pajak ('.($pricing['tax_percent'] ?? 0).'%)', 'value' => $idr($pricing['tax'])];
        }

        // Partial (down payment) settlements: show what is still owed rather
        // than letting a DP invoice read as fully settled.
        $outstanding = max(0.0, $bookingTotal - $charged);
        $isPartial = $outstanding > 0.009;

        $inv = [
            // ---- Document identity ----
            'invoice_number' => 'INV-'.strtoupper(substr((string) ($payment?->uuid ?? $booking->uuid), 0, 8)).'-'.$booking->id,
            'issued_at' => now()->translatedFormat('d F Y, H:i').' WIB',
            'booking_code' => $booking->code,
            'status_label' => $isPartial ? 'DIBAYAR SEBAGIAN (DP)' : 'LUNAS',
            'is_partial' => $isPartial,

            // ---- Issuer ----
            'issuer_name' => (string) config('branding.name', 'SJT Travel'),
            'issuer_legal' => (string) config('branding.tagline', 'Sekawan Jaya Trans'),
            'issuer_email' => (string) config('branding.support_email', 'mail@sekawanjayatrans.com'),

            // ---- Bill to ----
            'customer_name' => $booking->customer?->user?->name ?? ($booking->passengers->first()?->name ?? 'Pelanggan'),
            'customer_email' => $booking->customer?->user?->email,
            'phone' => $booking->customer?->phone ?? '—',

            // ---- Payment ----
            'payment_method' => ucwords(str_replace('_', ' ', (string) ($payment?->method ?? $payment?->provider ?? '—'))),
            'payment_provider' => $payment?->provider ? ucwords(str_replace('_', ' ', (string) $payment->provider)) : null,
            'payment_reference' => $payment?->reference,
            'paid_at' => $payment?->paid_at?->translatedFormat('d F Y, H:i').($payment?->paid_at ? ' WIB' : ''),

            // ---- Trip ----
            'route_code' => $schedule?->route?->code,
            'pickup' => $booking->pickup_label ?: ($schedule?->route?->origin ?? '—'),
            'destination' => $booking->drop_label ?: ($schedule?->route?->destination ?? '—'),
            'departure_date' => $departure?->translatedFormat('l, d F Y') ?? '—',
            'departure_time' => $departure ? $departure->format('H:i').' WIB' : '—',
            'arrival_estimate' => $arrival ? $arrival->translatedFormat('d F Y, H:i').' WIB' : null,
            'vehicle' => $schedule?->vehicle ? trim(($schedule->vehicle->brand ?? '').' · '.($schedule->vehicle->plate_number ?? ''), ' ·') : '—',
            'driver' => $schedule?->driver?->user?->name,

            // ---- Manifest ----
            'manifest' => $manifest,
            'seats' => $allSeats->implode(', ') ?: '—',
            'seat_count' => $seatCount,

            // ---- Totals ----
            'breakdown' => $breakdown,
            'booking_total' => $idr($bookingTotal),
            'amount_paid' => $idr($charged),
            'outstanding' => $isPartial ? $idr($outstanding) : null,
            'grand_total' => $idr($isPartial ? $charged : $bookingTotal),

            'booking_url' => rtrim((string) config('branding.site_url', ''), '/').'/customer/bookings/'.$booking->uuid,
        ];

        $tpl = EmailTemplate::resolve('payment_success', [
            'subject' => 'Invoice '.$inv['invoice_number'].' — Pembayaran Berhasil',
            'heading' => 'Terima kasih, {name}!',
            'intro' => 'Pembayaran Anda telah kami terima dan booking Anda terkonfirmasi. Berikut invoice lengkapnya:',
        ], ['name' => $inv['customer_name'], 'code' => $inv['booking_code']]);

        return $this
            ->subject($tpl['subject'])
            ->view('emails.payment-success')
            ->text('emails.payment-success-text')
            ->with([
                'inv' => $inv,
                'tpl' => $tpl,
                'toAddress' => $inv['customer_email'],
                'preheader' => 'Invoice '.$inv['invoice_number'].' · '.$inv['grand_total'].' · '.$inv['booking_code'],
            ]);
    }

    /**
     * Invoices get forwarded, printed and left on desks. A full national ID on
     * one is an identity-theft kit, so only the tail stays readable — enough
     * for the holder to confirm it is theirs, useless to anyone else.
     */
    private function maskIdentity(string $value): string
    {
        $value = trim($value);
        $length = mb_strlen($value);

        if ($length <= 4) {
            return str_repeat('•', $length);
        }

        return str_repeat('•', $length - 4).mb_substr($value, -4);
    }
}
