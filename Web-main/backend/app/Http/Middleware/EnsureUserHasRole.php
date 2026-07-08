<?php

declare(strict_types=1);

namespace App\Http\Middleware;

use App\Modules\Auth\Application\Services\PermissionService;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

final class EnsureUserHasRole
{
    public function __construct(private readonly PermissionService $permissions) {}
    public function handle(Request $request, Closure $next, string ...$roles): Response
    {
        abort_unless($request->user() && $this->permissions->hasRole($request->user(), $roles), 403, 'Role tidak diizinkan.');
        return $next($request);
    }
}
