<?php

namespace App\Jobs;

use App\Modules\Payments\Application\Services\PaymentService;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;

final class PaymentExpiredJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;
    public function __construct(public readonly string $paymentUuid) {}
    public function handle(PaymentService $payments): void { $payments->expire($this->paymentUuid); }
}
