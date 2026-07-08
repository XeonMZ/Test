<?php

namespace App\Support\FeatureFlags;

final class InMemoryFeatureFlagRepository implements FeatureFlagRepository
{
    /** @var array<string, bool> */
    private array $flags = [];
    public function enabled(FeatureFlag $flag): bool { return $this->flags[$flag->value] ?? false; }
    public function set(FeatureFlag $flag, bool $enabled): void { $this->flags[$flag->value] = $enabled; }
}
