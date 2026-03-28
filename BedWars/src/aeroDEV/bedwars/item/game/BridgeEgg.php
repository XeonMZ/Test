<?php

declare(strict_types=1);

namespace aeroDEV\bedwars\item\game;

use aeroDEV\bedwars\game\entity\misc\BridgeEgg as BridgeEggEntity;
use pocketmine\entity\Location;
use pocketmine\entity\projectile\Throwable;
use pocketmine\item\ItemIdentifier;
use pocketmine\item\ItemTypeIds;
use pocketmine\item\ProjectileItem;
use pocketmine\player\Player;
use pocketmine\utils\TextFormat;

class BridgeEgg extends ProjectileItem {

    public function __construct() {
        parent::__construct(new ItemIdentifier(ItemTypeIds::EGG), "Bridge Egg");
        $this->setCustomName(TextFormat::LIGHT_PURPLE . "Bridge Egg");
    }

    protected function createEntity(Location $location, Player $thrower): Throwable {
        return new BridgeEggEntity($location, $thrower);
    }

    public function getThrowForce(): float {
        return 1.35;
    }
}
