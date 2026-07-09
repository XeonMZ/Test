<?php

declare(strict_types=1);

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

final class DriverRequest extends FormRequest
{
    public function authorize(): bool { return true; }
    public function rules(): array { return ['user_id' => 'required|integer|exists:users,id', 'license_number' => 'required|string']; }
}
