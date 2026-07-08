<?php

namespace App\Modules\Realtime\Application;

use App\Support\FeatureFlags\FeatureFlagDefinition;
use App\Support\FeatureFlags\FeatureFlagService;

final class RealtimeService
{
    public function __construct(private readonly FeatureFlagService $features) {}

    public function canBroadcast(): bool
    {
        return $this->features->enabled(FeatureFlagDefinition::Realtime);
    }

    public function canBroadcastGps(): bool
    {
        return $this->canBroadcast() && $this->features->enabled(FeatureFlagDefinition::Gps);
    }

    public function canBroadcastNotifications(): bool
    {
        return $this->canBroadcast() && $this->features->enabled(FeatureFlagDefinition::Notifications);
    }
}
