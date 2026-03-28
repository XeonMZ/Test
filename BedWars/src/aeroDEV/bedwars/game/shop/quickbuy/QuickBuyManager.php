<?php

declare(strict_types=1);

namespace aeroDEV\bedwars\game\shop\quickbuy;

use aeroDEV\bedwars\BedWars;
use aeroDEV\bedwars\game\shop\item\ItemProduct;
use aeroDEV\bedwars\session\Session;
use aeroDEV\bedwars\utils\ConfigGetter;
use pocketmine\utils\TextFormat;

final class QuickBuyManager {

    /** @var array<string, string[]> */
    private static array $cache = [];

    private const DEFAULT_LAYOUT = [
        "Wool",
        "Stone Sword",
        "Permanent Chainmail Armor",
        "Permanent Shears",
        "Arrow",
        "Bow",
        "Speed II Potion (45 seconds)",
        "Fireball",
        "TNT"
    ];

    public static function getLayout(Session $session): array {
        $xuid = $session->getPlayer()->getXuid();
        if(isset(self::$cache[$xuid])) {
            return self::$cache[$xuid];
        }

        $layout = self::storage()->load($xuid);
        if($layout === null || $layout === []) {
            $layout = self::DEFAULT_LAYOUT;
            self::storage()->save($xuid, $layout);
        }

        return self::$cache[$xuid] = $layout;
    }

    public static function setLayout(Session $session, array $layout): void {
        $xuid = $session->getPlayer()->getXuid();
        self::$cache[$xuid] = array_values($layout);
        self::storage()->save($xuid, self::$cache[$xuid]);
    }

    public static function toggleProduct(Session $session, ItemProduct $product): void {
        $layout = self::getLayout($session);
        $id = $product->getId();

        $index = array_search($id, $layout, true);
        if($index !== false) {
            unset($layout[$index]);
            $session->message("{YELLOW}" . TextFormat::clean($product->getName()) . " removed from Quick Buy.");
            self::setLayout($session, $layout);
            return;
        }

        if(count($layout) >= 21) {
            $session->message("{RED}Quick Buy is full (21 slots). Remove an item first.");
            return;
        }

        $layout[] = $id;
        $session->message("{GREEN}" . TextFormat::clean($product->getName()) . " added to Quick Buy.");
        self::setLayout($session, $layout);
    }

    public static function clearCache(Session $session): void {
        unset(self::$cache[$session->getPlayer()->getXuid()]);
    }

    private static function storage(): QuickBuyStorage {
        return BedWars::getInstance()->getQuickBuyStorage();
    }
}
