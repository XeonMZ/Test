<?php

namespace App\Modules\Routes\Domain\Repositories;

interface RouteRepository
{
    public function findByUuid(string $uuid): mixed;
    public function save(object $aggregate): object;
}
