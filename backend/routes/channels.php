<?php

declare(strict_types=1);

use App\Models\User;
use Illuminate\Support\Facades\Broadcast;

Broadcast::channel('user.{userId}', fn (User $user, string $userId): bool => (string) $user->getKey() === $userId);
Broadcast::channel('notification.{userId}', fn (User $user, string $userId): bool => (string) $user->getKey() === $userId);

Broadcast::channel('admin', fn (User $user): bool => in_array($user->role, ['admin', 'owner'], true));
Broadcast::channel('owner', fn (User $user): bool => $user->role === 'owner');
Broadcast::channel('system', fn (User $user): bool => $user->role === 'owner');

// The location event also broadcasts on driver.{driverId} (Driver record id).
// This callback was missing, so that channel could never be subscribed —
// authorize the driver who owns the record, plus admin/owner monitoring.
Broadcast::channel('driver.{driverId}', function (User $user, string $driverId): bool {
    if (in_array($user->role, ['admin', 'owner'], true)) {
        return true;
    }
    return $user->role === 'driver'
        && \App\Models\Driver::where('user_id', $user->id)->where('id', $driverId)->exists();
});

// Live Trip Tracking: the trip's driver, admin/owner (monitoring), and
// customers with an active booking on the trip's schedule may listen.
Broadcast::channel('trip.{tripId}', function (User $user, string $tripId): bool {
    if (in_array($user->role, ['admin', 'owner'], true)) {
        return true;
    }
    $trip = \App\Models\Trip::query()->select('id', 'driver_id', 'schedule_id')->find($tripId);
    if ($trip === null) {
        return false;
    }
    if ($user->role === 'driver') {
        return \App\Models\Driver::where('user_id', $user->id)->where('id', $trip->driver_id)->exists();
    }
    return \App\Models\Booking::query()
        ->where('schedule_id', $trip->schedule_id)
        ->whereIn('status', ['paid', 'ticket_generated', 'completed'])
        ->whereHas('customer', fn ($c) => $c->where('user_id', $user->id))
        ->exists();
});
