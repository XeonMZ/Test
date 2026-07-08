<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use App\Support\ProductionReadinessService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\StreamedResponse;

final class ProductionReadinessController extends Controller
{
    public function __construct(private readonly ProductionReadinessService $readiness) {}

    public function health(): JsonResponse
    {
        return response()->json(['success' => true, 'data' => $this->readiness->health()]);
    }

    public function demoData(): JsonResponse
    {
        return response()->json(['success' => true, 'data' => $this->readiness->demoData()]);
    }

    public function deleteDemoData(Request $request): JsonResponse
    {
        abort_unless((bool) $request->boolean('confirm'), 422, 'Confirmation is required.');
        return response()->json(['success' => true, 'data' => $this->readiness->deleteDemoData($request->user())]);
    }

    public function export(): StreamedResponse
    {
        $payload = $this->readiness->exportConfiguration();
        return response()->streamDownload(fn () => print(json_encode($payload, JSON_PRETTY_PRINT | JSON_THROW_ON_ERROR)), 'stms-configuration.json', ['Content-Type' => 'application/json']);
    }

    public function import(Request $request): JsonResponse
    {
        $data = $request->validate(['settings' => ['array'], 'feature_flags' => ['array']]);
        return response()->json(['success' => true, 'data' => $this->readiness->importConfiguration($data, $request->user())]);
    }

    public function backup(Request $request): JsonResponse
    {
        return response()->json(['success' => true, 'data' => $this->readiness->backupConfiguration($request->user())]);
    }

    public function restore(Request $request): JsonResponse
    {
        $data = $request->validate(['path' => ['required', 'string']]);
        return response()->json(['success' => true, 'data' => $this->readiness->restoreConfiguration($data['path'], $request->user())]);
    }
}
