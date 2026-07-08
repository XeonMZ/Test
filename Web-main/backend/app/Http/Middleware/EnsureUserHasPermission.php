<?php

declare(strict_types=1);

namespace App\Http\Middleware;

use App\Modules\Auth\Application\Services\PermissionService;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

final class EnsureUserHasPermission
{
    public function __construct(private readonly PermissionService $permissions) {}
    public function handle(Request $request, Closure $next, string $permission): Response
    {
        abort_unless($request->user() && $this->permissions->can($request->user(), $permission), 403, 'Permission tidak diizinkan.');
        return $next($request);
    }
}
