<?php

namespace App\Support\Cache;

interface CacheStore
{
    public function remember(string $key, int $seconds, callable $resolver): mixed;
    public function forget(string $key): void;
}
