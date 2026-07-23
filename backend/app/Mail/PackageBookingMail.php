<?php

declare(strict_types=1);

namespace App\Mail;

use App\Models\PackageBooking;
use App\Support\Mail\EmailTemplate;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Queue\SerializesModels;

/** Package booking lifecycle email (received / paid / cancelled) — CMS-overridable copy. */
final class PackageBookingMail extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(
        public readonly int $packageBookingId,
        public readonly string $stage, // received | paid | cancelled
        public readonly ?string $instructions = null,
    ) {}

    public function build(): self
    {
        $booking = PackageBooking::with(['tourPackage:id,name,destination,duration_days', 'customer.user:id,name'])->findOrFail($this->packageBookingId);
        $name = $booking->customer?->user?->name ?? 'Pelanggan';
        $idr = fn (float $v): string => 'Rp'.number_format($v, 0, ',', '.');
        $outstanding = (float) $booking->outstanding_amount;
        $settled = (bool) $booking->is_settled;

        // A DP booking that is verified is confirmed but NOT paid off. Saying
        // "pembayaran Anda telah kami verifikasi" full stop would leave the
        // customer believing they owe nothing.
        $paidIntro = $settled
            ? 'Halo {name}, pembayaran Anda telah kami verifikasi dan booking ini LUNAS. Sampai jumpa di tanggal keberangkatan!'
            : 'Halo {name}, DP Anda telah kami verifikasi dan tempat Anda sudah diamankan. Sisa pembayaran '.$idr($outstanding).' mohon dilunasi sebelum tanggal keberangkatan.';

        $defaults = match ($this->stage) {
            'paid' => ['subject' => $settled ? 'Package Booking Confirmed - SJT Travel' : 'DP Diterima — Sisa Pembayaran Menunggu - SJT Travel', 'heading' => $settled ? 'Booking paket {code} terkonfirmasi! 🎉' : 'DP booking paket {code} diterima', 'intro' => $paidIntro],
            'cancelled' => ['subject' => 'Package Booking Cancelled - SJT Travel', 'heading' => 'Booking paket {code} dibatalkan', 'intro' => 'Halo {name}, booking paket wisata Anda telah dibatalkan. Hubungi kami bila ada pertanyaan.'],
            default => ['subject' => 'Package Booking Received - SJT Travel', 'heading' => 'Booking paket {code} diterima', 'intro' => 'Halo {name}, pesanan paket wisata Anda tercatat. Selesaikan pembayaran lalu tekan "Sudah Transfer" agar tim kami memverifikasi.'],
        };
        $tpl = EmailTemplate::resolve('package_booking', $defaults, ['name' => $name, 'code' => $booking->code, 'package' => $booking->tourPackage?->name]);

        return $this
            ->subject($tpl['subject'])
            ->view('emails.package-booking')
            ->text('emails.package-booking-text')
            ->with([
                'tpl' => $tpl,
                'stage' => $this->stage,
                'code' => $booking->code,
                'packageName' => $booking->tourPackage?->name ?? '—',
                'destination' => $booking->tourPackage?->destination,
                'travelDate' => $booking->travel_date?->translatedFormat('d F Y'),
                'pax' => $booking->pax,
                'amount' => $idr((float) $booking->amount),
                // DP breakdown. The template renders these only when isDp is
                // true, so full-payment emails are unchanged.
                'isDp' => (bool) $booking->is_dp,
                'isSettled' => $settled,
                'dpPercent' => $booking->dp_percent,
                'paidAmount' => $idr((float) $booking->paid_amount),
                'outstanding' => $idr($outstanding),
                'amountDueNow' => $idr($booking->amountDueNow()),
                'instructions' => $this->instructions,
            ]);
    }
}
