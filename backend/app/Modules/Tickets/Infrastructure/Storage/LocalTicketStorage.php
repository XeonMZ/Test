<?php

namespace App\Modules\Tickets\Infrastructure\Storage;

final class LocalTicketStorage implements TicketStorage
{
    public function put(string $path, string $contents): string
    {
        $fullPath = sys_get_temp_dir() . '/' . ltrim($path, '/');
        $directory = dirname($fullPath);
        if (! is_dir($directory)) mkdir($directory, 0775, true);
        file_put_contents($fullPath, $contents);
        return $fullPath;
    }
}
