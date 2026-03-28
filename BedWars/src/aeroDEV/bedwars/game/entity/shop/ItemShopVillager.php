<?php

declare(strict_types=1);


namespace aeroDEV\bedwars\game\entity\shop;


use aeroDEV\bedwars\form\shop\invmenu\InvMenuShopUI;

use dresnite\EasyUI\Form;
use aeroDEV\bedwars\form\shop\ShopForm;
use aeroDEV\bedwars\game\shop\Shop;
use aeroDEV\bedwars\game\shop\ShopFactory;
use aeroDEV\bedwars\session\Session;

class ItemShopVillager extends Villager {

    protected function getName(): string {
        return "ITEM SHOP";
    }


    protected function openChestUi(Session $session): void {
        InvMenuShopUI::openItemShop($session);
    }

    protected function getForm(Session $session): Form {
        $shop = ShopFactory::getShop(Shop::ITEM);
        return new ShopForm($session, "Quick buy", $shop);
    }

}