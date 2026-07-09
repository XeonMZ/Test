<?php
namespace App\Jobs;
final class DriverStatisticsJob { public function __construct(public readonly int $driverId) {} public function handle(): int { return $this->driverId; }}
