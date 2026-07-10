<?php

declare(strict_types=1);

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

final class SeatLockRequest extends FormRequest
{
    public function authorize(): bool { return true; }
    public function rules(): array { return ['booking_uuid' => ['required', 'uuid'], 'seat_ids' => ['required', 'array', 'min:1'], 'seat_ids.*' => ['integer', 'exists:vehicle_seats,id']]; }
}
