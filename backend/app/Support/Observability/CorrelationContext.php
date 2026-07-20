<?php

namespace App\Support\Observability;

final class CorrelationContext
{
    private static ?string $correlationId = null;
    private static ?string $requestId = null;
    private static ?float $startedAt = null;

    public static function start(?string $correlationId = null, ?string $requestId = null): void
    {
        self::$correlationId = $correlationId ?: bin2hex(random_bytes(16));
        self::$requestId = $requestId ?: bin2hex(random_bytes(16));
        self::$startedAt = microtime(true);
    }

    public static function correlationId(): string { return self::$correlationId ?? 'not-started'; }
    public static function requestId(): string { return self::$requestId ?? 'not-started'; }
    public static function durationMs(): float { return self::$startedAt === null ? 0.0 : round((microtime(true) - self::$startedAt) * 1000, 2); }
}
