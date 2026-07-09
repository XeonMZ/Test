<?php

namespace App\Support\FeatureFlags;

interface FeatureFlagRepository
{
    public function enabled(FeatureFlag $flag): bool;
    public function set(FeatureFlag $flag, bool $enabled): void;
}
