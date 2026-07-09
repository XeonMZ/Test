<?php

namespace App\Jobs;

use App\Models\Ticket;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;

final class GenerateQRCodeJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;
    public function __construct(public readonly string $ticketUuid) {}
    public function handle(): void { Ticket::where('uuid', $this->ticketUuid)->update(['metadata->qr_generated_at' => now()->toIso8601String()]); }
}
