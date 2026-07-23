<?php

declare(strict_types=1);

namespace App\Jobs;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Mail\Mailable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Mail;
use Throwable;

/**
 * Sends one transactional email asynchronously.
 * Retry with exponential backoff (1m → 5m → 15m → 1h), terminal failures are
 * recorded on the email_logs row so operations can see and re-trigger them.
 */
final class SendTransactionalEmail implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public int $tries = 5;

    /** @var array<int, int> exponential backoff in seconds */
    public array $backoff = [60, 300, 900, 3600];

    public function __construct(
        private readonly string $logUuid,
        private readonly string $toEmail,
        private readonly Mailable $mailable,
    ) {}

    public function handle(): void
    {
        DB::table('email_logs')->where('uuid', $this->logUuid)->increment('attempts');
        Mail::to($this->toEmail)->send($this->mailable);
        DB::table('email_logs')->where('uuid', $this->logUuid)->update(['status' => 'sent', 'sent_at' => now(), 'error' => null, 'updated_at' => now()]);
    }

    public function failed(Throwable $exception): void
    {
        DB::table('email_logs')->where('uuid', $this->logUuid)->update([
            'status' => 'failed',
            'error' => mb_substr($exception->getMessage(), 0, 2000),
            'updated_at' => now(),
        ]);
    }
}
