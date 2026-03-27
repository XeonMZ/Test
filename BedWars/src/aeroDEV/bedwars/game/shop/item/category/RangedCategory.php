<?php

declare(strict_types=1);


namespace aeroDEV\bedwars\game\shop\item\category;


use pocketmine\item\enchantment\EnchantmentInstance;
use pocketmine\item\enchantment\VanillaEnchantments;
use pocketmine\item\VanillaItems;
use aeroDEV\bedwars\game\shop\Category;
use aeroDEV\bedwars\game\shop\item\ItemProduct;
use aeroDEV\bedwars\session\Session;

class RangedCategory extends Category {

    public function __construct() {
        parent::__construct("Ranged");
    }

    /**
     * @return ItemProduct[]
     */
    public function getProducts(Session $session): array {
        $power = new EnchantmentInstance(VanillaEnchantments::POWER());
        return [
            new ItemProduct("Arrow", 2, 6, VanillaItems::ARROW(), VanillaItems::GOLD_INGOT()),
            new ItemProduct("Bow", 12, 1, VanillaItems::BOW(), VanillaItems::GOLD_INGOT()),
            new ItemProduct("Bow (Power I)", 20, 1, VanillaItems::BOW()->addEnchantment($power), VanillaItems::GOLD_INGOT()),
            new ItemProduct(
                "Bow (Power I, Punch I)",
                6, 1,
                VanillaItems::BOW()
                    ->addEnchantment($power)
                    ->addEnchantment(new EnchantmentInstance(VanillaEnchantments::PUNCH())),
                VanillaItems::EMERALD()
            ),

        ];
    }

}