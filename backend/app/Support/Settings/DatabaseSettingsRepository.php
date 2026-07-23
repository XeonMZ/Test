<?php

declare(strict_types=1);

namespace App\Support\Settings;

use App\Models\SystemSetting;
use Illuminate\Support\Str;

/**
 * Persists application settings in the system_settings table so changes made
 * by owner/admin survive across requests and deploys. Replaces the in-memory
 * repository which reset on every request.
 */
final class DatabaseSettingsRepository implements SettingsRepository
{
    /** @var array<string, mixed> */
    private const DEFAULTS = [
        'seat_lock_minutes' => 10,
        'payment_timeout_minutes' => 15,
        'gps_interval_seconds' => 30,
        'company_name' => 'SJT Travel & Tour',
        'whatsapp_number' => '',
        'currency' => 'IDR',
        'backup_enabled' => false,
        'maintenance_mode' => false,
    ];

    public function get(SettingKey $key): mixed
    {
        $row = SystemSetting::query()->where('key', $key->value)->first();
        if ($row === null) {
            return self::DEFAULTS[$key->value] ?? null;
        }

        // value is JSON-cast; unwrap a single scalar stored as {"value": x} too.
        $value = $row->value;
        if (is_array($value) && array_key_exists('value', $value)) {
            return $value['value'];
        }

        return $value;
    }

    public function put(SettingKey $key, mixed $value): void
    {
        SystemSetting::updateOrCreate(
            ['key' => $key->value],
            ['uuid' => (string) Str::uuid(), 'value' => $value, 'is_public' => false],
        );

        if ($key === SettingKey::MaintenanceMode) {
            cache()->forget('settings.maintenance_mode');
        }
    }
}
