<?php

declare(strict_types=1);

namespace App\Http\Resources;

use Illuminate\Http\Resources\Json\JsonResource;

final class ApiResource extends JsonResource
{
    public static function envelope(mixed $data = [], string $message = 'OK'): array
    {
        return ['success' => true, 'message' => $message, 'data' => $data];
    }

    public function withResponse($request, $response): void
    {
        $response->setData(self::envelope($this->resource));
    }
}
