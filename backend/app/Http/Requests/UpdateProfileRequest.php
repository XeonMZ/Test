<?php

declare(strict_types=1);

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

final class UpdateProfileRequest extends FormRequest
{
    public function authorize(): bool { return true; }
    public function rules(): array
    {
        return ['username' => ['sometimes', 'nullable', 'string', 'alpha_dash', 'min:3', 'max:64', \Illuminate\Validation\Rule::unique('users','username')->ignore($this->user()?->id)], 'name' => ['sometimes', 'string', 'max:255'], 'phone' => ['sometimes', 'string', 'max:30'], 'avatar' => ['sometimes', 'file', 'image', 'max:2048']];
    }
}
