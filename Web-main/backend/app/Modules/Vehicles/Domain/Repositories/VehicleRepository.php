<?php

namespace App\Modules\Vehicles\Domain\Repositories;

interface VehicleRepository
{
    public function findByUuid(string $uuid): mixed;
    public function save(object $aggregate): object;
}
