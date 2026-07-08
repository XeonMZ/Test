<?php

declare(strict_types=1);

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

final class BookingRequest extends FormRequest
{
    public function authorize(): bool { return true; }
    public function rules(): array
    {
        return ['schedule_id' => ['required', 'integer', 'exists:schedules,id'], 'customer_id' => ['required', 'integer', 'exists:customers,id'], 'seat_ids' => ['required', 'array', 'min:1'], 'seat_ids.*' => ['integer', 'exists:vehicle_seats,id'], 'passengers' => ['required', 'array', 'min:1'], 'passengers.*.name' => ['required', 'string', 'max:255'], 'passengers.*.identity_number' => ['sometimes', 'string', 'max:100'], 'amount' => ['sometimes', 'numeric', 'min:1']];
    }
}
