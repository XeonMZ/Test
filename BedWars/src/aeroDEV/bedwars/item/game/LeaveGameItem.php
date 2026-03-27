<?php

declare(strict_types=1);


namespace aeroDEV\bedwars\item\game;


use pocketmine\block\utils\DyeColor;
use pocketmine\block\VanillaBlocks;
use pocketmine\item\Item;
use aeroDEV\bedwars\item\BedwarsItem;
use aeroDEV\bedwars\session\Session;

class LeaveGameItem extends BedwarsItem {

    public function __construct() {
        parent::__construct("{RED}Leave game");
    }

    public function onInteract(Session $session): void {
        if($session->isPlaying()) {
            $session->getGame()->removePlayer($session);
        }
    }

    protected function realItem(): Item {
        return VanillaBlocks::BED()->setColor(DyeColor::RED())->asItem();
    }

}