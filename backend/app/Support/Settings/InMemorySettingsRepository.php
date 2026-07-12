<?php

namespace App\Support\Settings;

final class InMemorySettingsRepository implements SettingsRepository
{
    /** @var array<string, mixed> */
    private array $settings = [];

    public function __construct()
    {
        $this->settings = [
            SettingKey::SeatLockMinutes->value => 10,
            SettingKey::PaymentTimeoutMinutes->value => 15,
            SettingKey::GpsIntervalSeconds->value => 30,
            SettingKey::CompanyName->value => 'SJT Travel',
            SettingKey::WhatsAppNumber->value => '',
            SettingKey::Currency->value => 'IDR',
            SettingKey::BackupEnabled->value => false,
            SettingKey::MaintenanceMode->value => false,
        ];
    }

    public function get(SettingKey $key): mixed { return $this->settings[$key->value] ?? null; }
    public function put(SettingKey $key, mixed $value): void { $this->settings[$key->value] = $value; }
}
