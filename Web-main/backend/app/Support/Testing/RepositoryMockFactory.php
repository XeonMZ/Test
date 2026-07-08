<?php

namespace App\Support\Testing;

final class RepositoryMockFactory
{
    /** @return object{items: array<int, object>} */
    public static function emptyRepository(): object
    {
        return new class { /** @var array<int, object> */ public array $items = []; };
    }
}
