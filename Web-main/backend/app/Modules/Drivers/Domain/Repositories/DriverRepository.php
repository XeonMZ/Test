<?php

namespace App\Modules\Drivers\Domain\Repositories;

interface DriverRepository
{
    public function findByUuid(string $uuid): mixed;
    public function save(object $aggregate): object;
}
