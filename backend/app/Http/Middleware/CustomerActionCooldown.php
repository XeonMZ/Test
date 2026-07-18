<?php

declare(strict_types=1);

namespace App\Http\Middleware;

use App\Models\ActivityLog;
use App\Models\SystemSetting;
use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Symfony\Component\HttpFoundation\Response;

/**
 * Anti-spam cooldown for booking-type actions — CUSTOMER role only (owner,
 * admin, and driver are explicitly excluded). Cache::add() is atomic, so it
 * doubles as a transaction lock: two simultaneous submissions can never both
 * pass. Cooldown minutes are configurable via System Settings
 * (`anti_spam_cooldown_minutes`, default 5); violations are activity-logged.
 */
final class CustomerActionCooldown
{
    public function handle(Request $request, Closure $next, string $action = 'booking'): Response
    {
        $user = $request->user();
        if ($user === null || $user->role !== 'customer') {
            return $next($request);
        }

        $minutes = (int) ($this->setting('anti_spam_cooldown_minutes') ?? 5);
        if ($minutes <= 0) {
            return $next($request);
        }

        $key = "cooldown:{$action}:user:{$user->id}";
        if (! Cache::add($key, now()->toISOString(), now()->addMinutes($minutes))) {
            ActivityLog::create(['action' => 'antispam.cooldown_hit', 'subject_type' => 'User', 'subject_id' => $user->id, 'metadata' => ['action' => $action, 'ip' => $request->ip()]]);
            abort(429, "Terlalu sering. Mohon tunggu {$minutes} menit sebelum melakukan {$action} berikutnya.");
        }

        $response = $next($request);
        // Only successful submissions consume the cooldown — validation errors
        // release the lock immediately so genuine retries are not punished.
        if ($response->getStatusCode() >= 400) {
            Cache::forget($key);
        }
        return $response;
    }

    private function setting(string $key): mixed
    {
        $value = SystemSetting::query()->where('key', $key)->value('value');
        return is_array($value) ? ($value['value'] ?? null) : $value;
    }
}
