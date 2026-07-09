<?php

declare(strict_types=1);

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

final class UpdateProfileRequest extends FormRequest
{
    public function authorize(): bool { return true; }
    public function rules(): array
    {
        return ['name' => ['sometimes', 'string', 'max:255'], 'phone' => ['sometimes', 'string', 'max:30'], 'avatar' => ['sometimes', 'file', 'image', 'max:2048']];
    }
}
