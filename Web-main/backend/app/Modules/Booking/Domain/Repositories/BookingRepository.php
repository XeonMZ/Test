<?php

namespace App\Modules\Booking\Domain\Repositories;

interface BookingRepository
{
    public function findByUuid(string $uuid): mixed;
    public function save(object $aggregate): object;
}
