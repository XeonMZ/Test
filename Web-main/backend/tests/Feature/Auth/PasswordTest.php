<?php

declare(strict_types=1);

namespace Tests\Feature\Auth;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Password;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

final class PasswordTest extends TestCase
{
    use RefreshDatabase;

    public function test_forgot_password_sends_reset_link(): void
    {
        Password::shouldReceive('sendResetLink')->once()->andReturn(Password::RESET_LINK_SENT);
        $this->postJson('/api/forgot-password', ['email' => 'customer@example.test'])->assertOk()->assertJsonPath('success', true);
    }

    public function test_user_can_change_password(): void
    {
        $user = User::create(['name' => 'Customer', 'email' => 'customer@example.test', 'password' => Hash::make('Password123!'), 'role' => 'customer', 'is_active' => true]);
        Sanctum::actingAs($user);
        $this->putJson('/api/change-password', ['current_password' => 'Password123!', 'password' => 'NewPassword123!', 'password_confirmation' => 'NewPassword123!'])->assertOk()->assertJsonPath('success', true);
    }
}
