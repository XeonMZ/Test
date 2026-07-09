<?php

namespace App\Support\Settings;

interface SettingsRepository
{
    public function get(SettingKey $key): mixed;
    public function put(SettingKey $key, mixed $value): void;
}
