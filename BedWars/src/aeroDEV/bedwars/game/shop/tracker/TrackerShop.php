<?php

declare(strict_types=1);


namespace aeroDEV\bedwars\game\shop\tracker;


use aeroDEV\bedwars\game\shop\Category;
use aeroDEV\bedwars\game\shop\Shop;

class TrackerShop extends Shop {

    public function getId(): string {
        return Shop::TRACKER;
    }

    /**
     * @return Category[]
     */
    public function getCategories(): array {
        return [
            new TrackerCategory()
        ];
    }

}