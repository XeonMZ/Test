<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use App\Models\ActivityLog;
use App\Models\AuditTrail;
use App\Models\SystemSetting;
use App\Modules\Realtime\Application\RealtimeService;
use App\Support\Audit\RequestContext;
use App\Support\FeatureFlags\FeatureFlagDefinition;
use App\Support\FeatureFlags\FeatureFlagService;
use App\Support\Maps\MapProviderResolver;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;

/**
 * Map Provider settings (Provider Pattern, server side).
 *
 * - `config()` — every authenticated role: the resolved provider each map page
 *   must use (beta rule already applied by MapProviderResolver).
 * - `settings()`/`update()`/`simulator()` — super admin (owner) only: switch
 *   provider, toggle FEATURE_MAP_BETA, view health statuses, start/stop the
 *   simulator. Every change lands in the existing audit trail. Changes are
 *   effective immediately (SystemSetting + cached feature flag with bust).
 */
final class MapSettingsController extends Controller
{
    public function __construct(
        private readonly MapProviderResolver $resolver,
        private readonly FeatureFlagService $features,
        private readonly RealtimeService $realtime,
    ) {}

    /** Resolved provider for map pages (all roles). */
    public function config(): JsonResponse
    {
        return response()->json(['data' => $this->resolver->resolve()]);
    }

    // --------------------------- Super admin ---------------------------

    private function assertOwner(Request $request): void
    {
        abort_unless($request->user()?->role === 'owner', 403, 'Hanya super admin (owner) yang dapat mengelola Map Provider.');
    }

    public function settings(Request $request): JsonResponse
    {
        $this->assertOwner($request);
        $resolution = $this->resolver->resolve();

        return response()->json(['data' => [
            'resolution' => $resolution,
            'statuses' => [
                'active_provider' => $resolution['provider'],
                'feature_map_beta' => $resolution['beta_enabled'],
                'google_api' => filled(config('services.google_maps.key')) ? 'configured' : 'not_configured',
                'osm_tiles' => $this->probe('https://tile.openstreetmap.org/0/0/0.png'),
                'osrm' => $this->probe(rtrim((string) config('services.osrm.url'), '/').'/route/v1/driving/112.75,-7.25;112.76,-7.26?overview=false'),
                'websocket' => $this->realtime->canBroadcast() ? 'ready' : 'not_ready',
                'simulator_running' => (bool) $this->settingValue('map_simulator_running', false),
            ],
        ]]);
    }

    public function update(Request $request): JsonResponse
    {
        $this->assertOwner($request);
        $data = $request->validate([
            'provider' => 'sometimes|string|in:google,osm,beta',
            'beta_enabled' => 'sometimes|boolean',
        ]);

        if (array_key_exists('beta_enabled', $data)) {
            $before = $this->resolver->betaEnabled();
            if ($before !== (bool) $data['beta_enabled']) {
                $this->features->set(FeatureFlagDefinition::MapBeta, (bool) $data['beta_enabled']);
                $this->audit($request, $data['beta_enabled'] ? 'map.beta_enabled' : 'map.beta_disabled', ['before' => $before, 'after' => (bool) $data['beta_enabled']]);
                $this->audit($request, 'map.feature_flag_changed', ['flag' => 'map_beta', 'before' => $before, 'after' => (bool) $data['beta_enabled']]);
            }
        }

        if (array_key_exists('provider', $data)) {
            $before = $this->resolver->requested();
            if ($before !== $data['provider']) {
                SystemSetting::updateOrCreate(['key' => MapProviderResolver::SETTING_KEY], ['value' => $data['provider'], 'is_public' => true]);
                $this->audit($request, 'map.provider_changed', ['before' => $before, 'after' => $data['provider']]);
                $this->audit($request, match ($data['provider']) {
                    'google' => 'map.google_mode_enabled',
                    'osm' => 'map.osm_mode_enabled',
                    default => 'map.beta_mode_enabled',
                }, ['provider' => $data['provider']]);
            }
        }

        return response()->json(['data' => $this->resolver->resolve()]);
    }

    /** Start/stop the (frontend, in-memory) simulator — audited server-side. */
    public function simulator(Request $request, string $action): JsonResponse
    {
        $this->assertOwner($request);
        abort_unless(in_array($action, ['start', 'stop'], true), 404);
        abort_unless($this->resolver->betaActive(), 422, 'Simulator hanya tersedia saat Map Provider = beta dan FEATURE_MAP_BETA aktif.');

        SystemSetting::updateOrCreate(['key' => 'map_simulator_running'], ['value' => $action === 'start', 'is_public' => false]);
        $this->audit($request, $action === 'start' ? 'map.simulator_started' : 'map.simulator_stopped', []);

        return response()->json(['data' => ['running' => $action === 'start']]);
    }

    // ------------------------------ Helpers ------------------------------

    private function settingValue(string $key, mixed $default): mixed
    {
        $value = SystemSetting::query()->where('key', $key)->value('value');
        return $value === null ? $default : (is_array($value) ? ($value['value'] ?? $default) : $value);
    }

    /** Best-effort reachability probe; 'unknown' when egress is blocked. */
    private function probe(string $url): string
    {
        try {
            return Http::timeout(2)->connectTimeout(2)->get($url)->successful() ? 'reachable' : 'error';
        } catch (\Throwable) {
            return 'unknown';
        }
    }

    private function audit(Request $request, string $action, array $meta): void
    {
        $meta = RequestContext::enrich($request, $meta);
        AuditTrail::record($action, 'MapSettings', 'user', (string) $request->user()?->id, $meta);
        ActivityLog::create(['action' => $action, 'subject_type' => 'MapSettings', 'subject_id' => null, 'metadata' => $meta]);
    }
}
