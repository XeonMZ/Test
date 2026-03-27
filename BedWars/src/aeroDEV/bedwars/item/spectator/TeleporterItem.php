<?php

declare(strict_types=1);


namespace aeroDEV\bedwars\item\spectator;


use pocketmine\item\Item;
use pocketmine\item\VanillaItems;
use aeroDEV\bedwars\form\spectator\TeleporterForm;
use aeroDEV\bedwars\session\Session;

class TeleporterItem extends SpectatorItem {

    public function __construct() {
        parent::__construct("{GREEN}Teleporter");
    }

    protected function onSpectatorInteract(Session $session): void {
        $session->getPlayer()->sendForm(new TeleporterForm($session));
    }

    protected function realItem(): Item {
        return VanillaItems::COMPASS();
    }

}