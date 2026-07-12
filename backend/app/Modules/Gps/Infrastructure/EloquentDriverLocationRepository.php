<?php

declare(strict_types=1);

namespace App\Modules\Gps\Infrastructure;

use App\Modules\Gps\Domain\Entities\DriverLocation;
use App\Modules\Gps\Domain\Repositories\DriverLocationRepository;
use Illuminate\Support\Facades\DB;

/**
 * Persists GPS pings to the driver_locations table so that positions
 * survive across requests/processes — a hard requirement for customer
 * tracking. Replaces the previous in-memory implementation.
 */
final class EloquentDriverLocationRepository implements DriverLocationRepository
{
    public function save(DriverLocation $location): DriverLocation
    {
        DB::table('driver_locations')->insert([
            'driver_id' => (int) $location->driverId,
            'trip_id' => (int) $location->tripId,
            'latitude' => $location->latitude,
            'longitude' => $location->longitude,
            'speed' => $location->speed,
            'heading' => $location->heading,
            'accuracy' => $location->accuracy,
            'battery' => $location->battery,
            'recorded_at' => $location->recordedAt,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        return $location;
    }

    /** @return list<DriverLocation> */
    public function history(string $tripId): array
    {
        return DB::table('driver_locations')
            ->where('trip_id', (int) $tripId)
            ->orderBy('recorded_at')
            ->limit(500)
            ->get()
            ->map(fn (object $row): DriverLocation => new DriverLocation(
                (string) $row->driver_id,
                (string) $row->trip_id,
                (float) $row->latitude,
                (float) $row->longitude,
                (string) $row->recorded_at,
                $row->speed !== null ? (float) $row->speed : null,
                $row->heading !== null ? (float) $row->heading : null,
                $row->accuracy !== null ? (float) $row->accuracy : null,
                $row->battery !== null ? (int) $row->battery : null,
                (string) $row->recorded_at,
            ))
            ->all();
    }
}
