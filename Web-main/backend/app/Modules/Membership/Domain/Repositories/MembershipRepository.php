<?php

namespace App\Modules\Membership\Domain\Repositories;

interface MembershipRepository
{
    public function findByUuid(string $uuid): mixed;
    public function save(object $aggregate): object;
}
