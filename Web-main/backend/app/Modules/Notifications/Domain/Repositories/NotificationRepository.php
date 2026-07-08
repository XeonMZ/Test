<?php

namespace App\Modules\Notifications\Domain\Repositories;

interface NotificationRepository
{
    public function findByUuid(string $uuid): mixed;
    public function save(object $aggregate): object;
}
