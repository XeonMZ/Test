<?php

declare(strict_types=1);

namespace aeroDEV\bedwars\game\shop\quickbuy;

interface QuickBuyStorage {

    public function load(string $xuid): ?array;

    public function save(string $xuid, array $layout): void;
}
