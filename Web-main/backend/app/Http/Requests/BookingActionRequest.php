<?php

declare(strict_types=1);

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

final class BookingActionRequest extends FormRequest
{
    public function authorize(): bool { return true; }
    public function rules(): array { return ['booking_uuid' => ['required', 'uuid']]; }
}
