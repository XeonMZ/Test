<?php

declare(strict_types=1);


namespace aeroDEV\bedwars\item\game;


use pocketmine\item\Item;
use pocketmine\item\VanillaItems;
use aeroDEV\bedwars\form\shop\ShopForm;
use aeroDEV\bedwars\form\shop\chest\ChestShopForm;
use aeroDEV\bedwars\game\shop\Shop;
use aeroDEV\bedwars\game\shop\ShopFactory;
use aeroDEV\bedwars\item\BedwarsItem;
use aeroDEV\bedwars\session\Session;

class TrackerShopItem extends BedwarsItem {

    public function __construct() {
        parent::__construct("Tracker Shop", false);
    }

    public function onInteract(Session $session): void {
        $shop = ShopFactory::getShop(Shop::TRACKER);
        if($session->getGameSettings()->usesChestShopUI()) {
            $session->getPlayer()->sendForm(new ChestShopForm($session, "Tracker & Communication", $shop));
            return;
        }
        $session->getPlayer()->sendForm(new ShopForm($session, "Tracker & Communication", $shop));
    }

    protected function realItem(): Item {
        return VanillaItems::COMPASS();
    }

}