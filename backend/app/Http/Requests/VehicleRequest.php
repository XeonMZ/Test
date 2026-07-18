<?php

declare(strict_types=1);

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

final class VehicleRequest extends FormRequest
{
    public function authorize(): bool { return true; }
    public function rules(): array { return ['plate_number' => 'required|string', 'code' => 'required|string', 'brand' => 'required|string']; }
}
