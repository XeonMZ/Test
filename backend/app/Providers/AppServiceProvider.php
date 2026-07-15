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

        // #8 Enterprise password policy applied wherever Password::defaults() is used
        // (registration, password reset): min 8 chars, mixed case, numbers, symbols.
        \Illuminate\Validation\Rules\Password::defaults(function () {
            $rule = \Illuminate\Validation\Rules\Password::min(8)->mixedCase()->numbers()->symbols();
            return $this->app->environment('production') ? $rule->uncompromised() : $rule;
        });

        // API-only app: the default reset link targets route('password.reset'),
        // which is not defined here and would throw RouteNotFoundException the
        // moment a reset email is rendered. Point the link at the frontend page.
        \Illuminate\Auth\Notifications\ResetPassword::createUrlUsing(function (object $notifiable, string $token): string {
            $base = (string) config('authentication.password_reset_url');
            return $base.(str_contains($base, '?') ? '&' : '?').'token='.$token.'&email='.urlencode((string) $notifiable->getEmailForPasswordReset());
        });

        Gate::policy(User::class, UserPolicy::class);
        Gate::define('has-permission', fn (User $user, string $permission): bool => $permissions->can($user, $permission));
        Gate::define('admin-operational-crud', fn (User $user): bool => $permissions->hasRole($user, 'admin'));
        Gate::define('owner-read-only', fn (User $user): bool => $permissions->hasRole($user, 'owner'));
        RateLimiter::for('login', fn (Request $request): Limit => Limit::perMinute(5)->by(strtolower((string) $request->input('email')).'|'.$request->ip()));
        RateLimiter::for('register', fn (Request $request): Limit => Limit::perMinute(3)->by($request->ip()));
        RateLimiter::for('password-reset', fn (Request $request): Limit => Limit::perMinute(3)->by(strtolower((string) $request->input('email')).'|'.$request->ip()));
    }
}
