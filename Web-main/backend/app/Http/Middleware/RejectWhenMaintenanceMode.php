<?php

declare(strict_types=1);

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

final class RejectWhenMaintenanceMode
{
    public function handle(Request $request, Closure $next): Response
    {
        abort_if((bool) config('app.maintenance_mode', false), 503, 'Sistem sedang maintenance.');
        return $next($request);
    }
}
