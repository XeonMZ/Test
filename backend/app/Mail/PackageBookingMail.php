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
        $defaults = match ($this->stage) {
            'paid' => ['subject' => 'Package Booking Confirmed - SJT Travel', 'heading' => 'Booking paket {code} terkonfirmasi! 🎉', 'intro' => 'Halo {name}, pembayaran Anda telah kami verifikasi. Sampai jumpa di tanggal keberangkatan!'],
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
                'amount' => 'Rp'.number_format((float) $booking->amount, 0, ',', '.'),
                'instructions' => $this->instructions,
            ]);
    }
}
