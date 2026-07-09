<?php

namespace App\Support\Cache;

final class RedisCacheStore implements CacheStore
{
    /** @var array<string, mixed> */
    private array $fallback = [];

    public function remember(string $key, int $seconds, callable $resolver): mixed
    {
        if (array_key_exists($key, $this->fallback)) return $this->fallback[$key];
        return $this->fallback[$key] = $resolver();
    }

    public function forget(string $key): void
    {
        unset($this->fallback[$key]);
    }
}
