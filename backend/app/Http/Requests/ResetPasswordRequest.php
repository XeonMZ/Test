<?php

declare(strict_types=1);

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rules\Password;

/**
 * Password reset via one-time passcode.
 *
 * `code` is validated for *shape* only (six digits). Whether it is the right
 * code is decided by OtpService under a row lock — never here, so that a
 * validation message can't become an oracle.
 */
final class ResetPasswordRequest extends FormRequest
{
    public function authorize(): bool { return true; }

    public function rules(): array
    {
        return [
            'email' => ['required', 'email'],
            'code' => ['required', 'string', 'regex:/^[0-9]{6}$/'],
            'password' => ['required', 'confirmed', Password::defaults()],
        ];
    }

    public function messages(): array
    {
        return ['code.regex' => 'Kode verifikasi terdiri dari 6 digit angka.'];
    }
}
