<?php

namespace App\Modules\CheckIn\Presentation;

use App\Modules\CheckIn\Application\Services\BoardingService;
use App\Modules\CheckIn\Application\Services\CheckInService;
use App\Modules\CheckIn\Application\Services\PassengerStatusService;
use App\Support\Http\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

final class CheckInController
{
    public function store(Request $request, CheckInService $checkIns): JsonResponse
    {
        $data = $request->validate(['qr_payload'=>['required','string'],'driver_uuid'=>['required','string'],'latitude'=>['nullable','numeric'],'longitude'=>['nullable','numeric']]);
        return response()->json(ApiResponse::success('Passenger checked in', $checkIns->checkIn($data['qr_payload'], $data['driver_uuid'], $data['latitude'] ?? null, $data['longitude'] ?? null)));
    }
    public function noShow(Request $request, CheckInService $checkIns): JsonResponse
    {
        $data = $request->validate(['ticket_uuid'=>['required','string'],'driver_uuid'=>['required','string'],'latitude'=>['nullable','numeric'],'longitude'=>['nullable','numeric']]);
        return response()->json(ApiResponse::success('Passenger marked no show', $checkIns->noShow($data['ticket_uuid'], $data['driver_uuid'], $data['latitude'] ?? null, $data['longitude'] ?? null)));
    }
    public function board(Request $request, BoardingService $boarding): JsonResponse
    {
        $data = $request->validate(['ticket_uuid'=>['required','string']]);
        return response()->json(ApiResponse::success('Passenger boarded', $boarding->board($data['ticket_uuid'])));
    }
    public function tripPassengers(string $trip, PassengerStatusService $passengers): JsonResponse
    {
        return response()->json(ApiResponse::success('Trip passengers', $passengers->tripPassengers($trip)));
    }
}
