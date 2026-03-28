<?php

declare(strict_types=1);

namespace aeroDEV\bedwars\game\shop\upgrades;

use aeroDEV\bedwars\game\shop\Category;
use aeroDEV\bedwars\game\shop\Shop;
use aeroDEV\bedwars\game\shop\upgrades\category\TrapsCategory;
use aeroDEV\bedwars\game\shop\upgrades\category\UpgradesCategory;

class UpgradesShop extends Shop {

    /**
     * @return Category[]
     */
    public function getCategories(): array {
        return [
            new UpgradesCategory(),
            new TrapsCategory()
        ];
    }

    public function getId(): string {
        return Shop::UPGRADES;
    }
}
