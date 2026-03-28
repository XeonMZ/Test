<?php

declare(strict_types=1);


namespace aeroDEV\bedwars\game\shop\item\category;


use pocketmine\block\VanillaBlocks;
use pocketmine\item\VanillaItems;
use aeroDEV\bedwars\game\shop\Category;
use aeroDEV\bedwars\game\shop\item\ItemProduct;
use aeroDEV\bedwars\item\game\Fireball;
use aeroDEV\bedwars\item\BedwarsItems;
use aeroDEV\bedwars\session\Session;

class MiscCategory extends Category {

    public function __construct() {
        parent::__construct("Misc");
    }

    /**
     * @return ItemProduct[]
     */
    public function getProducts(Session $session): array {
        $tower = VanillaBlocks::CHEST()->asItem();
        $tower->setCustomName("§r§6Tower");

        return [
            new ItemProduct("Golden Apple", 3, 1, VanillaItems::GOLDEN_APPLE(), VanillaItems::GOLD_INGOT()),
            new ItemProduct("Fireball", 40, 1, new Fireball(), VanillaItems::IRON_INGOT()),
            new ItemProduct("TNT", 3, 1, VanillaBlocks::TNT(), VanillaItems::GOLD_INGOT()),
            new ItemProduct("Ender Pearl", 1, 4, VanillaItems::ENDER_PEARL(), VanillaItems::EMERALD()),
            new ItemProduct("Water Bucket", 3, 1, VanillaItems::WATER_BUCKET(), VanillaItems::GOLD_INGOT()),
            new ItemProduct("Magic Milk", 4, 1, VanillaItems::MILK_BUCKET(), VanillaItems::GOLD_INGOT()),
            new ItemProduct("Sponge", 3, 4, VanillaBlocks::SPONGE(), VanillaItems::GOLD_INGOT()),
            new ItemProduct("Tower", 40, 1, $tower, VanillaItems::IRON_INGOT()),
            new ItemProduct("Tracker Shop", 2, 1, BedwarsItems::TRACKER_SHOP()->asItem(), VanillaItems::EMERALD(), null, !$session->getPlayer()->getInventory()->contains(BedwarsItems::TRACKER_SHOP()->asItem()))
        ];
    }

}
