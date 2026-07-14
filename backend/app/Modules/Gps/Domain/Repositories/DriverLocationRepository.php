<?php

namespace App\Modules\Gps\Domain\Repositories;

use App\Modules\Gps\Domain\Entities\DriverLocation;

interface DriverLocationRepository
{
    public function save(DriverLocation $location): DriverLocation;
    /** @return list<DriverLocation> */
    public function history(string $tripId): array;
}
