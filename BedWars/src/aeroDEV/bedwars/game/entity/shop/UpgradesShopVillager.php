<?php

declare(strict_types=1);


namespace aeroDEV\bedwars\game\entity\shop;


use dresnite\EasyUI\Form;
use aeroDEV\bedwars\form\shop\CategoryForm;
use aeroDEV\bedwars\form\shop\chest\ChestShopForm;
use aeroDEV\bedwars\game\shop\Shop;
use aeroDEV\bedwars\game\shop\ShopFactory;
use aeroDEV\bedwars\game\shop\upgrades\UpgradesShop;
use aeroDEV\bedwars\session\Session;
use aeroDEV\bedwars\utils\ColorUtils;

class UpgradesShopVillager extends Villager {

    protected function getName(): string {
        return "TEAM\n{AQUA}UPGRADES";
    }

    protected function getForm(Session $session): Form {
        /** @var UpgradesShop $shop */
        $shop = ShopFactory::getShop(Shop::UPGRADES);

        if($session->getGameSettings()->usesChestShopUI()) {
            return new ChestShopForm($session, "Team Upgrades", $shop);
        }

        $form = new CategoryForm($session, $shop->getCategories()[0]);
        $form->addRedirectFormButton(
            ColorUtils::translate("{GOLD}{BOLD}Traps{RESET}\n{YELLOW}Click to view!"),
            new CategoryForm($session, $shop->getCategories()[1])
        );
        return $form;
    }

}