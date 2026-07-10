<?php
namespace App\Jobs;
final class DriverNotificationJob { /** @param array<string,mixed> $payload */ public function __construct(public readonly array $payload) {} public function handle(): array { return $this->payload; }}
