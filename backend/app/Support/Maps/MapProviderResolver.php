<?php

declare(strict_types=1);

namespace App\Support\Maps;

use App\Models\SystemSetting;
use App\Support\FeatureFlags\FeatureFlagDefinition;
use App\Support\FeatureFlags\FeatureFlagService;

/**
 * Provider Pattern — server side. The ONE place that decides which map
 * provider is effective, including the hard rule:
 *
 *   MAP_PROVIDER=beta AND FEATURE_MAP_BETA=false → beta is refused and the
 *   system falls back to the default provider with an explicit message.
 *
 * Everything (frontend map pages, super-admin panel, simulator endpoints)
 * consumes this resolution; no provider if/else lives anywhere else.
 */
final class MapProviderResolver
{
    public const PROVIDERS = ['google', 'osm', 'beta'];
    public const SETTING_KEY = 'map_provider';
    public const DEFAULT = 'google';

    public function __construct(private readonly FeatureFlagService $features) {}

    /** The provider as configured (may be blocked). */
    public function requested(): string
    {
        $value = SystemSetting::query()->where('key', self::SETTING_KEY)->value('value');
        $provider = is_array($value) ? ($value['value'] ?? null) : $value;
        return in_array($provider, self::PROVIDERS, true) ? $provider : self::DEFAULT;
    }

    public function betaEnabled(): bool
    {
        return $this->features->enabled(FeatureFlagDefinition::MapBeta);
    }

    /**
     * @return array{requested: string, provider: string, beta_enabled: bool, beta_blocked: bool, message: ?string}
     */
    public function resolve(): array
    {
        $requested = $this->requested();
        $betaEnabled = $this->betaEnabled();
        $blocked = $requested === 'beta' && ! $betaEnabled;

        return [
            'requested' => $requested,
            'provider' => $blocked ? self::DEFAULT : $requested,
            'beta_enabled' => $betaEnabled,
            'beta_blocked' => $blocked,
            'message' => $blocked ? 'Beta Mode sedang dinonaktifkan (FEATURE_MAP_BETA=false). Sistem berjalan dengan provider default.' : null,
        ];
    }

    /** True only when beta is both requested and allowed. */
    public function betaActive(): bool
    {
        $r = $this->resolve();
        return $r['provider'] === 'beta';
    }
}
