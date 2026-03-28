<?php

declare(strict_types=1);

namespace aeroDEV\bedwars\item\game;

use pocketmine\item\Item;

use pocketmine\item\VanillaItems;

use aeroDEV\bedwars\form\settings\ShopSettingsForm;

use aeroDEV\bedwars\item\BedwarsItem;

use aeroDEV\bedwars\session\Session;

class SettingsItem extends BedwarsItem {

    public function __construct() {

        parent::__construct("Settings");

    }

    public function onInteract(Session $session): void {

        $session->getPlayer()->sendForm(new ShopSettingsForm($session));

    }

    protected function realItem(): Item {

        $item = VanillaItems::BOOK();

        $item->setCustomName("§r§5Settings");

        return $item;

    }

}