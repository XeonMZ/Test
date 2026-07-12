<?php

namespace App\Support\Audit;

use App\Support\Observability\CorrelationContext;

final class AuditLogger
{
    /** @param array<string, mixed> $metadata */
    public function record(AuditAction $action, string $subject, array $metadata = []): array
    {
        return ['action' => $action->value, 'subject' => $subject, 'metadata' => $metadata, 'correlation_id' => CorrelationContext::correlationId(), 'recorded_at' => gmdate(DATE_ATOM)];
    }
}
