<?php

namespace App\Modules\Seats\Domain\Repositories;

interface SeatRepository
{
    public function findByUuid(string $uuid): mixed;
    public function save(object $aggregate): object;
}
