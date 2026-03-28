<?php

declare(strict_types=1);


namespace aeroDEV\bedwars\game\shop\upgrades\category;


use aeroDEV\bedwars\game\shop\Category;
use aeroDEV\bedwars\game\shop\upgrades\product\UpgradeProduct;
use aeroDEV\bedwars\game\shop\upgrades\UpgradesProduct;
use aeroDEV\bedwars\session\Session;
use pocketmine\item\VanillaItems;

class UpgradesCategory extends Category {

    public function __construct() {
        parent::__construct("Upgrades");
    }

    /**
     * @return UpgradesProduct[]
     */
    public function getProducts(Session $session): array {
        $upgrades = $session->getTeam()->getUpgrades();
        $tower_level = $upgrades->getTowerOfHope()->getLevel();
        return [
            new UpgradeProduct("Sharpened Swords", 4),
            new UpgradeProduct("Armor Protection", 2 ** ($upgrades->getArmorProtection()->getLevel() + 1)),
            new UpgradeProduct("Maniac Miner", 2 ** ($upgrades->getManiacMiner()->getLevel() + 1)),
            new UpgradeProduct("Iron Forge", 2 * ($upgrades->getIronForge()->getLevel() + 1)),
            new UpgradeProduct("Heal Pool", 1),
            new UpgradeProduct("Tower Of Hope", 4, $tower_level >= 1 ? VanillaItems::EMERALD() : VanillaItems::DIAMOND()),
            new UpgradeProduct("Bridge Of Life", 2, VanillaItems::EMERALD())
        ];
    }

}
