<?php

declare(strict_types=1);


namespace aeroDEV\bedwars\game\entity\shop;



use dresnite\EasyUI\Form;
use aeroDEV\bedwars\form\shop\ShopForm;
use aeroDEV\bedwars\form\shop\chest\ChestShopForm;
use aeroDEV\bedwars\game\shop\Shop;
use aeroDEV\bedwars\game\shop\ShopFactory;
use aeroDEV\bedwars\session\Session;

class ItemShopVillager extends Villager {

    protected function getName(): string {
        return "ITEM SHOP";
    }

    protected function getForm(Session $session): Form {
        $shop = ShopFactory::getShop(Shop::ITEM);
        if($session->getGameSettings()->usesChestShopUI()) {
            return new ChestShopForm($session, "Quick buy", $shop);
        }
        return new ShopForm($session, "Quick buy", $shop);
    }

}