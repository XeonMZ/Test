<?php

declare(strict_types=1);

namespace aeroDEV\bedwars\game\shop\item;

use aeroDEV\bedwars\game\shop\Category;
use aeroDEV\bedwars\game\shop\item\category\ArmorCategory;
use aeroDEV\bedwars\game\shop\item\category\BlocksCategory;
use aeroDEV\bedwars\game\shop\item\category\MeleeCategory;
use aeroDEV\bedwars\game\shop\item\category\MiscCategory;
use aeroDEV\bedwars\game\shop\item\category\PotionsCategory;
use aeroDEV\bedwars\game\shop\item\category\RangedCategory;
use aeroDEV\bedwars\game\shop\item\category\ToolsCategory;
use aeroDEV\bedwars\game\shop\Shop;

class ItemShop extends Shop {

    private array $categories = [];

    public function getId(): string {
        return Shop::ITEM;
    }

    /**
     * @return Category[]
     */
    public function getCategories(): array {
        if(empty($this->categories)) {
            $this->categories = [
                new BlocksCategory(),
                new MeleeCategory(),
                new ArmorCategory(),
                new ToolsCategory(),
                new RangedCategory(),
                new PotionsCategory(),
                new MiscCategory()
            ];
        }
        return $this->categories;
    }
}