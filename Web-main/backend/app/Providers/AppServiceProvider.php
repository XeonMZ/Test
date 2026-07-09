<?php

declare(strict_types=1);

namespace App\Providers;

use App\Models\User;
use App\Modules\Auth\Application\Services\PermissionService;
use App\Policies\UserPolicy;
use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\ServiceProvider;

final class AppServiceProvider extends ServiceProvider
{
    public function register(): void {}

    public function boot(PermissionService $permissions): void
    {
        date_default_timezone_set('Asia/Jakarta');
        Gate::policy(User::class, UserPolicy::class);
        Gate::define('has-permission', fn (User $user, string $permission): bool => $permissions->can($user, $permission));
        Gate::define('admin-operational-crud', fn (User $user): bool => $permissions->hasRole($user, 'admin'));
        Gate::define('owner-read-only', fn (User $user): bool => $permissions->hasRole($user, 'owner'));
        RateLimiter::for('login', fn (Request $request): Limit => Limit::perMinute(5)->by(strtolower((string) $request->input('email')).'|'.$request->ip()));
        RateLimiter::for('register', fn (Request $request): Limit => Limit::perMinute(3)->by($request->ip()));
        RateLimiter::for('password-reset', fn (Request $request): Limit => Limit::perMinute(3)->by(strtolower((string) $request->input('email')).'|'.$request->ip()));
    }
}
