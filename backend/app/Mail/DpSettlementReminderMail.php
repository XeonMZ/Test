<?php

declare(strict_types=1);

namespace App\Mail;

use App\Support\Mail\EmailTemplate;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Queue\SerializesModels;

/** DP settlement reminder — CMS-overridable copy. */
final class DpSettlementReminderMail extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(
        public readonly string $name,
        public readonly string $bookingCode,
        public readonly string $remaining,
        public readonly string $deadline,
        public readonly string $settlementUrl,
    ) {}

    public function build(): self
    {
        $tpl = EmailTemplate::resolve('dp_settlement_reminder', [
            'subject' => 'Reminder: Selesaikan Pelunasan - SJT Travel',
            'heading' => 'Pelunasan booking {code} menunggu',
            'intro' => 'Halo {name}, booking Anda menunggu pelunasan sebesar {remaining} sebelum {deadline}. Segera selesaikan agar kursi Anda tetap aman.',
        ], ['name' => $this->name, 'code' => $this->bookingCode, 'remaining' => $this->remaining, 'deadline' => $this->deadline]);

        return $this
            ->subject($tpl['subject'])
            ->view('emails.dp-settlement-reminder')
            ->text('emails.dp-settlement-reminder-text')
            ->with(['tpl' => $tpl, 'remaining' => $this->remaining, 'deadline' => $this->deadline, 'settlementUrl' => $this->settlementUrl]);
    }
}
