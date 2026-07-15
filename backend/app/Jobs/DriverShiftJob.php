<?php
namespace App\Jobs;
final class DriverShiftJob { public function __construct(public readonly int $driverId, public readonly string $status) {} public function handle(): array { return ['driver_id'=>$this->driverId,'status'=>$this->status]; }}
