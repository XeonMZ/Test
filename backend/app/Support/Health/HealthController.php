<?php

declare(strict_types=1);

namespace App\Support\Health;

use App\Support\ProductionReadinessService;
use Illuminate\Http\JsonResponse;

final class HealthController
{
    public function __construct(private readonly ProductionReadinessService $readiness) {}

    public function health(): JsonResponse
    {
        return response()->json(['success' => true, 'message' => 'OK', 'data' => ['status' => 'healthy']]);
    }

    public function ready(): JsonResponse
    {
        return response()->json(['success' => true, 'message' => 'Ready', 'data' => $this->readiness->health()]);
    }

    public function version(): JsonResponse
    {
        return response()->json(['success' => true, 'message' => 'Version', 'data' => ['version' => getenv('APP_VERSION') ?: '0.1.0']]);
    }
}
