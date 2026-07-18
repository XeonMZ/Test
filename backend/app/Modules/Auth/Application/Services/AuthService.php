<?php

declare(strict_types=1);

namespace App\Modules\Auth\Application\Services;

use App\Events\UserLoggedIn;
use App\Events\UserLoggedOut;
use App\Events\UserRegistered;
use App\Models\Customer;
use App\Models\Membership;
use App\Models\User;
use Illuminate\Auth\AuthenticationException;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

final class AuthService
{
    public function login(array $data, string $ip): array
    {
        $key = Str::lower($data['email']).'|'.$ip;
        if (RateLimiter::tooManyAttempts($key, 5)) {
            throw ValidationException::withMessages(['email' => ['Terlalu banyak percobaan login.']]);
        }
        $user = User::where('email', $data['email'])->first();
        if (!$user || !Hash::check($data['password'], $user->password) || !$user->is_active) {
            RateLimiter::hit($key, 60);
            throw ValidationException::withMessages(['email' => ['Kredensial tidak valid.']]);
        }
        RateLimiter::clear($key);
        $expiresAt = now()->addMinutes((int) config('authentication.token_expiration_minutes'));
        if ((bool) ($data['remember'] ?? false)) {
            $expiresAt = now()->addDays(30);
        }
        $token = $user->createToken($data['device_name'] ?? config('authentication.token_name'), ['*'], $expiresAt)->plainTextToken;
        UserLoggedIn::dispatch($user, ['ip' => $ip, 'remember' => (bool) ($data['remember'] ?? false)]);
        return ['token' => $token, 'token_type' => 'Bearer', 'expires_at' => $expiresAt->toISOString(), 'user' => $user->fresh(['customer', 'driver'])];
    }

    public function register(array $data): array
    {
        $user = User::create(['name' => $data['name'], 'email' => $data['email'], 'password' => Hash::make($data['password']), 'role' => 'customer', 'is_active' => true]);
        $customer = Customer::create(['user_id' => $user->id, 'phone' => $data['phone']]);
        Membership::create(['customer_id' => $customer->id, 'level' => 'bronze', 'points' => 0]);
        $token = $user->createToken(config('authentication.token_name'), ['*'], now()->addMinutes((int) config('authentication.token_expiration_minutes')))->plainTextToken;
        UserRegistered::dispatch($user, ['customer_id' => $customer->id]);
        return ['token' => $token, 'token_type' => 'Bearer', 'user' => $user->fresh(['customer.membership'])];
    }

    public function logout(User $user, bool $allDevices = false): void
    {
        if ($allDevices) {
            $user->tokens()->delete();
        } else {
            $user->currentAccessToken()?->delete();
        }
        UserLoggedOut::dispatch($user, ['all_devices' => $allDevices]);
    }

    public function refresh(User $user): array
    {
        $user->currentAccessToken()?->delete();
        $token = $user->createToken(config('authentication.token_name'), ['*'], now()->addMinutes((int) config('authentication.token_expiration_minutes')))->plainTextToken;
        return ['token' => $token, 'token_type' => 'Bearer', 'user' => $user];
    }
}
