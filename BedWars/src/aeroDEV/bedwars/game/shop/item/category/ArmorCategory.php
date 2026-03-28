<?php

declare(strict_types=1);


namespace aeroDEV\bedwars\game\shop\item\category;


use pocketmine\item\Item;
use pocketmine\item\VanillaItems;
use aeroDEV\bedwars\game\shop\Category;
use aeroDEV\bedwars\game\shop\item\ItemProduct;
use aeroDEV\bedwars\session\Session;
use aeroDEV\bedwars\session\settings\GameSettings;
use function ucfirst;

class ArmorCategory extends Category {

    public function __construct() {
        parent::__construct("Armor");
    }

    /**
     * @return ItemProduct[]
     */
    public function getProducts(Session $session): array {
        $settings = $session->getGameSettings();
        return [
            $this->createArmorProduct("chainmail", 30, VanillaItems::IRON_INGOT(), $settings),
            $this->createArmorProduct("iron", 12, VanillaItems::GOLD_INGOT(), $settings),
            $this->createArmorProduct("diamond", 6, VanillaItems::EMERALD(), $settings)
        ];
    }

    private function createArmorProduct(string $armor, int $price, Item $ore, GameSettings $settings): ItemProduct {
        return new ItemProduct("Permanent " . ucfirst($armor) . " Armor", $price, 1, $this->getDisplayArmorItem($armor), $ore, function(Session $session) use ($armor) {
            $session->getGameSettings()->setArmor($armor);
        }, $this->getPriority($settings->getArmor()) < $this->getPriority($armor));
    }

    private function getDisplayArmorItem(string $armor): Item {
        return match($armor) {
            "chainmail" => VanillaItems::CHAINMAIL_CHESTPLATE(),
            "iron" => VanillaItems::IRON_CHESTPLATE(),
            "diamond" => VanillaItems::DIAMOND_CHESTPLATE(),
            default => VanillaItems::LEATHER_CHESTPLATE()
        };
    }

    private function getPriority(?string $armor): int {
        return match($armor) {
            "chainmail" => 1,
            "iron" => 2,
            "diamond" => 3,
            default => 0
        };
    }

}
