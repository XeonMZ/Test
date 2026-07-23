<?php

use App\Support\Cache\RedisCacheStore;
use App\Support\Settings\InMemorySettingsRepository;
use App\Support\Settings\SettingKey;
use App\Support\Settings\SettingsService;
use PHPUnit\Framework\TestCase;

final class SettingsServiceTest extends TestCase
{
    public function test_settings_are_cached_and_can_be_invalidated(): void
    {
        $repository = new InMemorySettingsRepository();
        $service = new SettingsService($repository, new RedisCacheStore());
        self::assertSame(10, $service->get(SettingKey::SeatLockMinutes));
        $service->put(SettingKey::SeatLockMinutes, 12);
        self::assertSame(12, $service->get(SettingKey::SeatLockMinutes));
    }
}
