<?php

declare(strict_types=1);

use App\Models\User;
use Illuminate\Support\Facades\Broadcast;

Broadcast::channel('user.{userId}', fn (User $user, string $userId): bool => (string) $user->getKey() === $userId);
Broadcast::channel('notification.{userId}', fn (User $user, string $userId): bool => (string) $user->getKey() === $userId);

Broadcast::channel('admin', fn (User $user): bool => in_array($user->role, ['admin', 'owner'], true));
Broadcast::channel('owner', fn (User $user): bool => $user->role === 'owner');
Broadcast::channel('system', fn (User $user): bool => $user->role === 'owner');
