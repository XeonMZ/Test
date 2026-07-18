<?php

namespace App\Support\Observability;

final class StructuredLogger
{
    /** @param array<string, mixed> $context */
    public function info(string $message, array $context = []): array
    {
        return ['level' => 'info', 'message' => $message, 'context' => $context, 'correlation_id' => CorrelationContext::correlationId(), 'request_id' => CorrelationContext::requestId(), 'duration_ms' => CorrelationContext::durationMs(), 'timestamp' => gmdate(DATE_ATOM)];
    }
}
