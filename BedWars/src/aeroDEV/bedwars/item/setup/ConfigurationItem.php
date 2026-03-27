<?php

declare(strict_types=1);


namespace aeroDEV\bedwars\item\setup;


use pocketmine\item\Item;
use pocketmine\item\VanillaItems;
use aeroDEV\bedwars\form\setup\SetupMapForm;
use aeroDEV\bedwars\item\BedwarsItem;
use aeroDEV\bedwars\session\Session;

class ConfigurationItem extends BedwarsItem {

    public function __construct() {
        parent::__construct("Configuration");
    }

    public function onInteract(Session $session): void {
        $session->getPlayer()->sendForm(new SetupMapForm($session));
    }

    protected function realItem(): Item {
        return VanillaItems::PAPER();
    }

}