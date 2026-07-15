<?php

declare(strict_types=1);

namespace App\Http\Middleware;

use App\Support\Settings\SettingKey;
use App\Support\Settings\SettingsRepository;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * Blocks customer/driver traffic while the DB-backed maintenance_mode setting
 * (toggled from Admin → Settings) is on. Admin and owner accounts are exempt —
 * otherwise nobody could reach the settings endpoint to turn maintenance off.
 */
final class RejectWhenMaintenanceMode
{
    public function __construct(private readonly SettingsRepository $settings) {}

    public function handle(Request $request, Closure $next): Response
    {
        $enabled = (bool) cache()->remember(
            'settings.maintenance_mode',
            now()->addSeconds(15),
            fn (): bool => (bool) $this->settings->get(SettingKey::MaintenanceMode),
        );
        $role = $request->user()?->role;

        abort_if($enabled && ! in_array($role, ['admin', 'owner'], true), 503, 'Sistem sedang maintenance.');

        return $next($request);
    }
}
