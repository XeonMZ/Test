<?php

namespace App\Jobs;

final class AuditLogJob
{
    /** @param array<string, mixed> $payload */
    public function __construct(public readonly array $payload) {}

    public function handle(): void
    {
        // Queue-ready placeholder for AuditLogJob.
    }
}
