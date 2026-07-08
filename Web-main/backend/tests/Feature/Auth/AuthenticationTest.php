<?php

declare(strict_types=1);

namespace Tests\Feature\Auth;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

final class AuthenticationTest extends TestCase
{
    use RefreshDatabase;

    public function test_customer_can_register(): void
    {
        $this->postJson('/api/register', ['name' => 'Customer', 'email' => 'customer@example.test', 'phone' => '628123456789', 'password' => 'Password123!', 'password_confirmation' => 'Password123!'])
            ->assertCreated()->assertJsonPath('success', true)->assertJsonStructure(['data' => ['token', 'user']]);
    }

    public function test_user_can_login_and_logout(): void
    {
        $user = User::create(['name' => 'Customer', 'email' => 'customer@example.test', 'password' => Hash::make('Password123!'), 'role' => 'customer', 'is_active' => true]);
        $token = $this->postJson('/api/login', ['email' => $user->email, 'password' => 'Password123!', 'device_name' => 'phpunit'])->assertOk()->json('data.token');
        $this->withToken($token)->postJson('/api/logout')->assertOk()->assertJsonPath('success', true);
    }

    public function test_authenticated_user_can_read_and_update_profile(): void
    {
        $user = User::create(['name' => 'Customer', 'email' => 'customer@example.test', 'password' => Hash::make('Password123!'), 'role' => 'customer', 'is_active' => true, 'email_verified_at' => now()]);
        Sanctum::actingAs($user);
        $this->getJson('/api/profile')->assertOk()->assertJsonPath('data.email', $user->email);
        $this->putJson('/api/profile', ['name' => 'Updated'])->assertOk()->assertJsonPath('data.name', 'Updated');
    }
}
