<?php

declare(strict_types=1);

namespace aeroDEV\bedwars\form\shop\chest;

use aeroDEV\bedwars\form\SimpleForm;
use aeroDEV\bedwars\form\shop\CategoryForm;
use aeroDEV\bedwars\game\shop\Product;
use aeroDEV\bedwars\game\shop\Shop;
use aeroDEV\bedwars\game\shop\item\ItemShop;
use aeroDEV\bedwars\game\shop\upgrades\UpgradesShop;
use aeroDEV\bedwars\session\Session;
use aeroDEV\bedwars\session\SessionFactory;
use dresnite\EasyUI\element\Button;
use pocketmine\player\Player;
use pocketmine\utils\TextFormat;

class ChestShopForm extends SimpleForm {

    public function __construct(private Session $session, string $name, private Shop $shop) {
        parent::__construct("Chest UI - " . $name);
    }

    protected function onCreation(): void {
        $categories = $this->shop->getCategories();

        if($this->shop instanceof ItemShop) {
            $this->addRedirectFormButton("★ Kembali ke Quick Buy", new self($this->session, "Quick buy", $this->shop));

            $icons = ["■", "⚔", "👢", "⛏", "➶", "⚗", "TNT"];
            foreach($categories as $index => $category) {
                $icon = $icons[$index] ?? "•";
                $this->addRedirectFormButton($icon . " " . $category->getName(), new CategoryForm($this->session, $category));
            }
            return;
        }

        if($this->shop instanceof UpgradesShop) {
            foreach($categories as $category) {
                foreach($category->getProducts($this->session) as $product) {
                    $button = new Button("⬆ " . $product->getDisplayName($this->session) . "\n" . $product->getDescription($this->session));
                    $button->setSubmitListener(function(Player $player) use ($product): void {
                        $session = SessionFactory::getSession($player);
                        if($session !== null and $session->isPlaying() and $this->canPurchaseProduct($session, $product) and $product->onPurchase($session)) {
                            $player->getInventory()->removeItem($product->getOre());
                            $session->message("{GREEN}You purchased {GOLD}" . $product->getName());
                            $player->sendForm(new self($session, "Team Upgrades", $this->shop));
                        }
                    });
                    $this->addButton($button);
                }
            }
            return;
        }

        foreach($categories as $category) {
            $this->addRedirectFormButton($category->getName(), new CategoryForm($this->session, $category));
        }
    }

    private function canPurchaseProduct(Session $session, Product $product): bool {
        if(!$product->canBePurchased($session)) {
            $session->message("{RED}You already have this product!");
            return false;
        }

        $ore = $product->getOre();
        $inventory = $session->getPlayer()->getInventory();
        if(!$inventory->contains($ore)) {
            $count = 0;
            foreach($inventory->all($ore) as $item) {
                $count += $item->getCount();
            }
            $missing = $ore->getCount() - $count;
            $session->message(TextFormat::RED . "You don't have enough " . $ore->getName() . "! Need $missing more!");
            return false;
        }
        return true;
    }
}
