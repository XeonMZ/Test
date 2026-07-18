<?php

namespace App\Support\Testing;

final class TestDataFactory
{
    public static function uuid(): string { return '00000000-0000-4000-8000-' . substr(str_repeat('0', 12) . random_int(1, 999999), -12); }
}
