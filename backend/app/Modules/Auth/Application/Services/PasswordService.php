<?php

declare(strict_types=1);

namespace App\Modules\Auth\Application\Services;

use App\Events\PasswordChanged;
use App\Models\User;
use Illuminate\Auth\Events\PasswordReset;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Password;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

final class PasswordService
{
    public function forgot(array $data): string
    {
        // Email-enumeration protection: the response is identical whether or
        // not the address exists. Unknown addresses simply send nothing; the
        // broker's own throttle still applies for existing users. The reset
        // email itself is queued via User::sendPasswordResetNotification.
        Password::sendResetLink(['email' => $data['email']]);

        return 'Jika email terdaftar, tautan reset password telah dikirim. Periksa kotak masuk Anda.';
    }

    public function reset(array $data): string
    {
        $status = Password::reset($data, function (User $user, string $password): void {
            $user->forceFill(['password' => Hash::make($password), 'remember_token' => Str::random(60)])->save();
            event(new PasswordReset($user));
            PasswordChanged::dispatch($user, ['reset' => true]);
            $user->tokens()->delete();
        });
        if ($status !== Password::PASSWORD_RESET) {
            throw ValidationException::withMessages(['email' => [__($status)]]);
        }
        return __($status);
    }

    public function change(User $user, string $password): void
    {
        $user->forceFill(['password' => Hash::make($password)])->save();
        $user->tokens()->where('id', '!=', $user->currentAccessToken()?->id)->delete();
        PasswordChanged::dispatch($user, ['reset' => false]);
    }
}
