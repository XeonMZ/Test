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
        $data = $request->validate(['qr_payload'=>['required','string'],'driver_uuid'=>['sometimes','string'],'latitude'=>['nullable','numeric'],'longitude'=>['nullable','numeric']]);
        $driverUuid = $this->resolveDriverUuid($request, $data['driver_uuid'] ?? null);
        return response()->json(ApiResponse::success('Passenger checked in', $checkIns->checkIn($data['qr_payload'], $driverUuid, $data['latitude'] ?? null, $data['longitude'] ?? null)));
    }

    public function storeByCode(Request $request, CheckInService $checkIns): JsonResponse
    {
        $data = $request->validate(['ticket_number'=>['required','string','max:64'],'driver_uuid'=>['sometimes','string'],'latitude'=>['nullable','numeric'],'longitude'=>['nullable','numeric']]);
        $driverUuid = $this->resolveDriverUuid($request, $data['driver_uuid'] ?? null);
        return response()->json(ApiResponse::success('Passenger checked in', $checkIns->checkInByCode($data['ticket_number'], $driverUuid, $data['latitude'] ?? null, $data['longitude'] ?? null)));
    }
    public function noShow(Request $request, CheckInService $checkIns): JsonResponse
    {
        $data = $request->validate(['ticket_uuid'=>['required','string'],'driver_uuid'=>['sometimes','string'],'latitude'=>['nullable','numeric'],'longitude'=>['nullable','numeric']]);
        $driverUuid = $this->resolveDriverUuid($request, $data['driver_uuid'] ?? null);
        return response()->json(ApiResponse::success('Passenger marked no show', $checkIns->noShow($data['ticket_uuid'], $driverUuid, $data['latitude'] ?? null, $data['longitude'] ?? null)));
    }

    /**
     * Drivers always act as themselves — the client-supplied driver_uuid is
     * ignored for the driver role so scans cannot be attributed to others.
     * Admin/owner may supply an explicit driver_uuid when operating manually.
     */
    private function resolveDriverUuid(Request $request, ?string $provided): string
    {
        $user = $request->user();
        if ($user && $user->role === 'driver') {
            $uuid = \App\Models\Driver::where('user_id', $user->id)->value('uuid');
            abort_if($uuid === null, 422, 'Profil driver belum lengkap.');
            return (string) $uuid;
        }

        abort_if(empty($provided), 422, 'driver_uuid wajib diisi untuk peran staf.');
        return $provided;
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
