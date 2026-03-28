<?php

declare(strict_types=1);

namespace aeroDEV\bedwars\game\shop\quickbuy\storage;

use aeroDEV\bedwars\BedWars;
use aeroDEV\bedwars\game\shop\quickbuy\QuickBuyStorage;
use pocketmine\utils\Config;

final class JsonQuickBuyStorage implements QuickBuyStorage {

    private Config $config;

    public function __construct() {
        $this->config = new Config(BedWars::getInstance()->getDataFolder() . "quickbuy.json", Config::JSON);
    }

    public function load(string $xuid): ?array {
        $value = $this->config->get($xuid);
        return is_array($value) ? $value : null;
    }

    public function save(string $xuid, array $layout): void {
        $this->config->set($xuid, array_values($layout));
        $this->config->save();
    }
}
