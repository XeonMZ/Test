<?php

namespace App\Support\Http;

final class ApiResponse
{
    public static function success(string $message, mixed $data = [], int $status = 200): array
    {
        return ['success' => true, 'message' => $message, 'data' => $data, 'status' => $status];
    }

    public static function validation(array $errors): array
    {
        return ['success' => false, 'message' => 'Validation failed', 'errors' => $errors, 'status' => 422];
    }

    public static function paginated(string $message, array $items, int $page, int $perPage, int $total): array
    {
        return ['success' => true, 'message' => $message, 'data' => $items, 'meta' => ['page' => $page, 'per_page' => $perPage, 'total' => $total]];
    }
}
