<?php

namespace App\Support\Policies;

use App\Support\Settings\SettingKey;
use App\Support\Settings\SettingsService;

final class OperationalPolicy
{
    public function __construct(private readonly SettingsService $settings) {}

    public function seatLockMinutes(): int { return (int) $this->settings->get(SettingKey::SeatLockMinutes); }
    public function paymentTimeoutMinutes(): int { return (int) $this->settings->get(SettingKey::PaymentTimeoutMinutes); }
    public function gpsIntervalSeconds(): int { return (int) $this->settings->get(SettingKey::GpsIntervalSeconds); }
    public function companyName(): string { return (string) $this->settings->get(SettingKey::CompanyName); }
    public function whatsAppNumber(): string { return (string) $this->settings->get(SettingKey::WhatsAppNumber); }
    public function currency(): string { return (string) $this->settings->get(SettingKey::Currency); }
    public function backupEnabled(): bool { return (bool) $this->settings->get(SettingKey::BackupEnabled); }
    public function maintenanceMode(): bool { return (bool) $this->settings->get(SettingKey::MaintenanceMode); }
}
