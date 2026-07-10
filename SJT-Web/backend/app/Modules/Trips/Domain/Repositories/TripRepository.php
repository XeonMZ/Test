<?php

namespace App\Modules\Trips\Domain\Repositories;

interface TripRepository
{
    public function findByUuid(string $uuid): mixed;
    public function save(object $aggregate): object;
}
