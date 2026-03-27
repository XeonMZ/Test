<?php

declare(strict_types=1);


namespace aeroDEV\bedwars\form\shop;


use aeroDEV\bedwars\form\SimpleForm;
use aeroDEV\bedwars\game\shop\Shop;
use aeroDEV\bedwars\session\Session;
use aeroDEV\bedwars\utils\ColorUtils;

class ShopForm extends SimpleForm {

    private Session $session;
    private Shop $shop;

    public function __construct(Session $session, string $name, Shop $shop) {
        $this->session = $session;
        $this->shop = $shop;
        parent::__construct($name);
    }

    protected function onCreation(): void {
        foreach($this->shop->getCategories() as $category) {
            $this->addRedirectFormButton(
                ColorUtils::translate("{GOLD}{BOLD}" . $category->getName() . "{RESET}\n{YELLOW}Click to view!"),
                new CategoryForm($this->session, $category)
            );
        }
    }

}