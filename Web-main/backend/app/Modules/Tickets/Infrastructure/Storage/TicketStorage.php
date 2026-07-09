<?php

namespace App\Modules\Tickets\Infrastructure\Storage;

interface TicketStorage
{
    public function put(string $path, string $contents): string;
}
