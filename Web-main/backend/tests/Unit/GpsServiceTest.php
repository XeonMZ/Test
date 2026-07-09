<?php

use PHPUnit\Framework\TestCase;

final class GpsServiceTest extends TestCase
{
    public function test_gps_service_contract_exists(): void
    {
        self::assertTrue(class_exists(App\Modules\Gps\Application\GpsService::class));
    }
}
