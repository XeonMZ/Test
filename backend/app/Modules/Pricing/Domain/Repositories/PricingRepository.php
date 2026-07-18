<?php

namespace App\Modules\Pricing\Domain\Repositories;

interface PricingRepository
{
    public function findByUuid(string $uuid): mixed;
    public function save(object $aggregate): object;
}
