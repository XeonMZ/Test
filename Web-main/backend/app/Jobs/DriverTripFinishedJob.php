<?php
namespace App\Jobs;
final class DriverTripFinishedJob { public function __construct(public readonly int $tripId) {} public function handle(): int { return $this->tripId; }}
