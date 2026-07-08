<?php

namespace App\Support\Settings;

use App\Support\Cache\CacheStore;

final class SettingsService
{
    public function __construct(private readonly SettingsRepository $settings, private readonly CacheStore $cache) {}

    public function get(SettingKey $key): mixed
    {
        return $this->cache->remember('settings:' . $key->value, 3600, fn (): mixed => $this->settings->get($key));
    }

    public function put(SettingKey $key, mixed $value): void
    {
        $this->settings->put($key, $value);
        $this->cache->forget('settings:' . $key->value);
    }
}
