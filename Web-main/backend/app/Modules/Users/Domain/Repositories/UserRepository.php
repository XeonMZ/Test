<?php

namespace App\Modules\Users\Domain\Repositories;

interface UserRepository
{
    public function findByUuid(string $uuid): mixed;
    public function save(object $aggregate): object;
}
