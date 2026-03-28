<?php

declare(strict_types=1);


namespace aeroDEV\bedwars\game\shop;


use aeroDEV\bedwars\game\shop\item\ItemShop;
use aeroDEV\bedwars\game\shop\tracker\TrackerShop;
use aeroDEV\bedwars\game\shop\upgrades\UpgradesShop;

class ShopFactory {

    /** @var Shop[] */
    static private array $shops = [];

    static public function init(): void { // todo: use enums
        self::addShop(new ItemShop());
        self::addShop(new UpgradesShop());
        self::addShop(new TrackerShop());
    }

    static public function getShop(string $id): ?Shop {
        return self::$shops[$id] ?? null;
    }

    static private function addShop(Shop $shop): void {
        self::$shops[$shop->getId()] = $shop;
    }

}