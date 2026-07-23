<?php

declare(strict_types=1);

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

/** Submits a six-digit passcode for email verification. */
final class VerifyOtpRequest extends FormRequest
{
    public function authorize(): bool { return true; }

    public function rules(): array
    {
        return ['code' => ['required', 'string', 'regex:/^[0-9]{6}$/']];
    }

    public function messages(): array
    {
        return ['code.regex' => 'Kode verifikasi terdiri dari 6 digit angka.'];
    }
}
