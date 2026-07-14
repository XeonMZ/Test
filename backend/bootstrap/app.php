<?php

declare(strict_types=1);

use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(api: __DIR__.'/../routes/api.php', channels: __DIR__.'/../routes/channels.php', commands: __DIR__.'/../routes/console.php', health: '/up')
    ->withMiddleware(function (Middleware $middleware): void {
        $middleware->statefulApi();
        $middleware->api(append: [App\Http\Middleware\SecurityHeaders::class]);
        $middleware->alias([
            'role' => App\Http\Middleware\EnsureUserHasRole::class,
            'permission' => App\Http\Middleware\EnsureUserHasPermission::class,
            'active' => App\Http\Middleware\EnsureUserIsActive::class,
            'maintenance' => App\Http\Middleware\RejectWhenMaintenanceMode::class,
            'verified' => Illuminate\Auth\Middleware\EnsureEmailIsVerified::class,
        ]);
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        // API-only application: always negotiate JSON so HTML error pages never leak.
        $exceptions->shouldRenderJsonWhen(fn (): bool => true);

        // Domain/state-machine violations (invalid payment method, illegal shift
        // transition, forged webhook signature, …) are client errors, not server
        // faults. Surface their message as a 422 envelope the frontend understands.
        $exceptions->render(function (\InvalidArgumentException|\DomainException $e, \Illuminate\Http\Request $request) {
            return response()->json(['success' => false, 'message' => $e->getMessage(), 'data' => []], 422);
        });
    })
    ->withProviders()
    ->create();
