<?php

namespace App\Support\FeatureFlags;

interface FeatureFlagRepository
{
    public function enabled(FeatureFlagDefinition $flag): bool;
    public function set(FeatureFlagDefinition $flag, bool $enabled): void;
}
