<?php

declare(strict_types=1);

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

final class ScheduleRequest extends FormRequest
{
    public function authorize(): bool { return true; }
    public function rules(): array { return ['route_id' => 'required|integer|exists:routes,id', 'driver_id' => 'required|integer|exists:drivers,id', 'vehicle_id' => 'required|integer|exists:vehicles,id', 'departure_at' => 'required|date']; }
}
