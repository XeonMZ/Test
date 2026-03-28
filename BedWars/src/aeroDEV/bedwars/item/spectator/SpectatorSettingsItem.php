<?php

declare(strict_types=1);


namespace aeroDEV\bedwars\item\spectator;


use pocketmine\block\VanillaBlocks;
use pocketmine\item\Item;
use aeroDEV\bedwars\form\spectator\SpectatorSettingsForm;
use aeroDEV\bedwars\session\Session;

class SpectatorSettingsItem extends SpectatorItem {

    public function __construct() {
        parent::__construct("{YELLOW}Spectator settings");
    }

    protected function onSpectatorInteract(Session $session): void {
        $session->getPlayer()->sendForm(new SpectatorSettingsForm($session));
    }

    protected function realItem(): Item {
        return VanillaBlocks::REDSTONE_COMPARATOR()->asItem();
    }

}