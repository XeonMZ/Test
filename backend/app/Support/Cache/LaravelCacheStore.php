<?php

declare(strict_types=1);

namespace App\Support\Cache;

use Illuminate\Support\Facades\Cache;

/**
 * CacheStore backed by Laravel's cache manager (respects CACHE_STORE env:
 * file, database, redis, etc). Replaces the previous in-memory-only store so
 * cached values persist across requests and processes.
 */
final class LaravelCacheStore implements CacheStore
{
    public function remember(string $key, int $seconds, callable $resolver): mixed
    {
        return Cache::remember($key, $seconds, $resolver);
    }

    public function forget(string $key): void
    {
        Cache::forget($key);
    }
}
