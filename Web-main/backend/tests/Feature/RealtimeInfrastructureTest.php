<?php

use PHPUnit\Framework\TestCase;

final class RealtimeInfrastructureTest extends TestCase
{
    public function test_realtime_routes_are_documented(): void
    {
        self::assertFileExists(__DIR__ . '/../../routes/channels.php');
    }
}
