<?php

namespace App\Support\FeatureFlags;

use App\Support\Cache\CacheStore;

final class FeatureFlagService
{
    public function __construct(private readonly FeatureFlagRepository $flags, private readonly CacheStore $cache) {}
    public function enabled(FeatureFlag $flag): bool { return (bool) $this->cache->remember('feature:' . $flag->value, 300, fn (): bool => $this->flags->enabled($flag)); }
    public function set(FeatureFlag $flag, bool $enabled): void { $this->flags->set($flag, $enabled); $this->cache->forget('feature:' . $flag->value); }
}
