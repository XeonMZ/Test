<?php

declare(strict_types=1);

namespace App\Console\Commands;

use App\Mail\DpSettlementReminderMail;
use App\Models\Booking;
use App\Models\SystemSetting;
use App\Support\Mail\TransactionalMailer;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;

/**
 * DP settlement reminders. For every booking that has a partial (DP) payment
 * but is not yet fully settled, emails the customer a reminder as the
 * settlement deadline approaches, and marks it overdue past the deadline.
 *
 * Idempotent per day: the mailer dedupe key includes the date bucket, so a
 * customer receives at most one reminder per booking per day even if the
 * scheduler runs the command repeatedly.
 */
final class SendDpSettlementRemindersCommand extends Command
{
    protected $signature = 'payment:dp-settlement-reminders';
    protected $description = 'Remind customers to settle Down Payment bookings before the deadline.';

    public function handle(TransactionalMailer $mailer): int
    {
        if (! (bool) $this->setting('payment_dp_enabled', false)) {
            $this->info('DP disabled — nothing to do.');
            return self::SUCCESS;
        }

        $deadlineHours = (int) ($this->setting('payment_dp_settlement_hours', 48) ?: 48);
        $sent = 0;

        // Bookings paid (DP secures the booking) that still owe a balance.
        Booking::query()
            ->where('status', 'paid')
            ->with(['customer.user:id,name,email'])
            ->whereHas('payment', fn ($q) => $q->where('status', 'paid'))
            ->chunkById(200, function ($bookings) use ($mailer, $deadlineHours, &$sent): void {
                foreach ($bookings as $booking) {
                    $paidSum = (int) DB::table('payments')->where('booking_id', $booking->id)->where('status', 'paid')->whereNull('deleted_at')->sum('amount');
                    $remaining = (int) $booking->amount - $paidSum;
                    if ($remaining <= 0) {
                        continue; // fully settled
                    }

                    $firstPaidAt = DB::table('payments')->where('booking_id', $booking->id)->where('status', 'paid')->min('paid_at');
                    $deadline = $firstPaidAt ? \Illuminate\Support\Carbon::parse($firstPaidAt)->addHours($deadlineHours) : now()->addHours($deadlineHours);
                    $email = $booking->customer?->user?->email;
                    if (! $email) {
                        continue;
                    }

                    // Remind within 24h of the deadline, or once it has passed.
                    if (now()->lt($deadline->copy()->subDay())) {
                        continue;
                    }

                    $queued = $mailer->queue(
                        'dp_settlement_reminder',
                        (string) $email,
                        'Reminder: Selesaikan Pelunasan - SJT Travel',
                        new DpSettlementReminderMail(
                            $booking->customer?->user?->name ?? 'Pelanggan',
                            (string) $booking->code,
                            'Rp'.number_format($remaining, 0, ',', '.'),
                            $deadline->translatedFormat('d M Y H:i').' WIB',
                            rtrim((string) env('FRONTEND_URL', ''), '/').'/customer/bookings/'.$booking->uuid,
                        ),
                        'booking:'.$booking->uuid.':settle:'.now()->format('Ymd'),
                        $booking->customer?->user_id,
                        ['booking_code' => $booking->code, 'remaining' => $remaining],
                    );
                    if ($queued) {
                        $sent++;
                    }
                }
            });

        $this->info("DP settlement reminders queued: {$sent}");
        return self::SUCCESS;
    }

    private function setting(string $key, mixed $default): mixed
    {
        $value = SystemSetting::query()->where('key', $key)->value('value');
        return $value === null ? $default : (is_array($value) ? ($value['value'] ?? $default) : $value);
    }
}
