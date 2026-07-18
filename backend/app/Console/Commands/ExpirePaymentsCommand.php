<?php

declare(strict_types=1);

namespace App\Console\Commands;

use App\Models\Payment;
use App\Modules\Payments\Application\Services\PaymentService;
use Illuminate\Console\Command;

/**
 * Scheduler backstop: expires pending payments whose window has elapsed,
 * covering deployments where delayed queue jobs are unavailable or missed.
 */
final class ExpirePaymentsCommand extends Command
{
    protected $signature = 'payment:expire-due';

    protected $description = 'Expire pending payments whose payment window has elapsed.';

    public function handle(PaymentService $payments): int
    {
        $count = 0;
        Payment::query()
            ->where('status', 'pending')
            ->whereNotNull('expires_at')
            ->where('expires_at', '<=', now())
            ->pluck('uuid')
            ->each(function (string $uuid) use ($payments, &$count): void {
                $payments->expire($uuid);
                $count++;
            });

        $this->info((string) $count);

        return self::SUCCESS;
    }
}
