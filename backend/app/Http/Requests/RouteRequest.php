<?php

declare(strict_types=1);

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

final class RouteRequest extends FormRequest
{
    public function authorize(): bool { return true; }
    public function rules(): array { return ['code' => 'required|string|max:50', 'origin' => 'required|string', 'destination' => 'required|string']; }
}
