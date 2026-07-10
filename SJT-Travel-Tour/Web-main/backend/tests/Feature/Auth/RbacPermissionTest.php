<?php

declare(strict_types=1);

namespace Tests\Feature\Auth;

use App\Models\User;
use App\Modules\Auth\Application\Services\PermissionService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

final class RbacPermissionTest extends TestCase
{
    use RefreshDatabase;

    public function test_customer_permissions_are_limited(): void
    {
        $service = app(PermissionService::class);
        $user = User::create(['name' => 'Customer', 'email' => 'customer@example.test', 'password' => Hash::make('Password123!'), 'role' => 'customer', 'is_active' => true]);
        self::assertTrue($service->can($user, 'booking:create'));
        self::assertFalse($service->can($user, 'driver:create'));
    }

    public function test_admin_wildcard_permission_allows_operations(): void
    {
        $service = app(PermissionService::class);
        $user = User::create(['name' => 'Admin', 'email' => 'admin@example.test', 'password' => Hash::make('Password123!'), 'role' => 'admin', 'is_active' => true]);
        self::assertTrue($service->can($user, 'booking:update'));
    }
}
