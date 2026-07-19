<?php

declare(strict_types=1);

namespace App\Support\FeatureFlags;

use App\Models\FeatureFlag as FeatureFlagModel;
use Illuminate\Support\Str;

/**
 * Persists feature flags in the feature_flags table. Replaces the in-memory
 * repository so toggles by owner/admin actually stick.
 */
final class DatabaseFeatureFlagRepository implements FeatureFlagRepository
{
    /** Flags enabled by default until explicitly toggled off. */
    private const DEFAULT_ENABLED = ['gps', 'membership', 'voucher', 'realtime', 'qr', 'notifications'];

    public function enabled(FeatureFlagDefinition $flag): bool
    {
        $row = FeatureFlagModel::query()->where('key', $flag->value)->first();
        if ($row === null) {
            return in_array($flag->value, self::DEFAULT_ENABLED, true);
        }

        return (bool) $row->enabled;
    }

    public function set(FeatureFlagDefinition $flag, bool $enabled): void
    {
        FeatureFlagModel::updateOrCreate(
            ['key' => $flag->value],
            ['uuid' => (string) Str::uuid(), 'enabled' => $enabled, 'metadata' => []],
        );
    }
}
