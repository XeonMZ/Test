<?php

declare(strict_types=1);

namespace App\Modules\Auth\Application\Services;

use App\Models\User;

final class PermissionService
{
    public function hasRole(User $user, string|array $roles): bool
    {
        return in_array($user->role, (array) $roles, true);
    }

    public function can(User $user, string $permission): bool
    {
        $permissions = config('permission.permissions.'.$user->role, []);
        foreach ($permissions as $allowed) {
            if ($allowed === '*' || $allowed === $permission || str_ends_with($allowed, ':*') && str_starts_with($permission, substr($allowed, 0, -1))) {
                return true;
            }
        }
        return false;
    }
}
