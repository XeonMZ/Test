<?php

declare(strict_types=1);

namespace aeroDEV\bedwars\form\shop\invmenu;

use aeroDEV\bedwars\game\shop\item\ItemProduct;
use aeroDEV\bedwars\game\shop\item\ItemShop;
use aeroDEV\bedwars\game\shop\quickbuy\QuickBuyManager;
use aeroDEV\bedwars\game\shop\Shop;
use aeroDEV\bedwars\game\shop\upgrades\UpgradesProduct;
use aeroDEV\bedwars\game\shop\upgrades\UpgradesShop;
use aeroDEV\bedwars\session\Session;
use muqsit\invmenu\InvMenu;
use muqsit\invmenu\transaction\InvMenuTransaction;
use pocketmine\item\VanillaItems;
use pocketmine\utils\TextFormat;

final class InvMenuShopUI {

    public static function openItemShop(Session $session, int $categoryIndex = -1): void {
        /** @var ItemShop $shop */
        $shop = \aeroDEV\bedwars\game\shop\ShopFactory::getShop(Shop::ITEM);
        if(!$shop instanceof ItemShop) {
            return;
        }

        $menu = InvMenu::create(InvMenu::TYPE_DOUBLE_CHEST);
        $menu->setName("Item Shop (Hypixel Style)");

        $inventory = $menu->getInventory();
        $inventory->clearAll();

        $productsBySlot = [];
        $quickSlots = [0,1,2,3,4,5,6,9,10,11,12,13,14,15,18,19,20,21,22,23,24];
        $layout = QuickBuyManager::getLayout($session);
        $lookup = self::buildItemLookup($session, $shop);

        foreach($quickSlots as $i => $slot) {
            $productId = $layout[$i] ?? null;
            if($productId === null || !isset($lookup[$productId])) {
                $inventory->setItem($slot, VanillaItems::GRAY_DYE()->setCustomName(TextFormat::GRAY . "Empty Quick Buy"));
                continue;
            }

            $product = $lookup[$productId];
            $inventory->setItem($slot, $product->getItem()->setCustomName($product->getDisplayName($session)));
            $productsBySlot[$slot] = $product;
        }

        $icons = [VanillaItems::BRICK(), VanillaItems::IRON_SWORD(), VanillaItems::CHAINMAIL_BOOTS(), VanillaItems::IRON_PICKAXE(), VanillaItems::BOW(), VanillaItems::POTION(), VanillaItems::TNT()];
        foreach($shop->getCategories() as $index => $category) {
            $icon = clone ($icons[$index] ?? VanillaItems::PAPER());
            $inventory->setItem(45 + $index, $icon->setCustomName(TextFormat::AQUA . $category->getName()));
        }

        if($categoryIndex >= 0 && isset($shop->getCategories()[$categoryIndex])) {
            $products = $shop->getCategories()[$categoryIndex]->getProducts($session);
            foreach(array_slice($products, 0, 21) as $index => $product) {
                $slot = $quickSlots[$index];
                $inventory->setItem($slot, $product->getItem()->setCustomName($product->getDisplayName($session)));
                $productsBySlot[$slot] = $product;
            }
        }

        $inventory->setItem(53, VanillaItems::BOOK()->setCustomName(TextFormat::YELLOW . "Sneak+Click: edit Quick Buy"));

        $menu->setListener(InvMenu::readonly(function(InvMenuTransaction $transaction) use ($session, $productsBySlot, $shop): void {
            $player = $transaction->getPlayer();
            $slot = $transaction->getAction()->getSlot();

            if($slot >= 45 && $slot <= 51) {
                $player->removeCurrentWindow();
                self::openItemShop($session, $slot - 45);
                return;
            }

            if(!isset($productsBySlot[$slot])) {
                return;
            }

            $product = $productsBySlot[$slot];
            if($player->isSneaking()) {
                QuickBuyManager::toggleProduct($session, $product);
                $player->removeCurrentWindow();
                self::openItemShop($session, -1);
                return;
            }

            if(self::purchase($session, $product)) {
                $player->removeCurrentWindow();
                self::openItemShop($session, -1);
            }
        }));

        $menu->send($session->getPlayer());
    }

    public static function openUpgradesShop(Session $session): void {
        /** @var UpgradesShop $shop */
        $shop = \aeroDEV\bedwars\game\shop\ShopFactory::getShop(Shop::UPGRADES);
        if(!$shop instanceof UpgradesShop) {
            return;
        }

        $menu = InvMenu::create(InvMenu::TYPE_DOUBLE_CHEST);
        $menu->setName("Team Upgrades (Hypixel Style)");

        $inventory = $menu->getInventory();
        $productsBySlot = [];
        $slot = 10;
        foreach($shop->getCategories() as $category) {
            foreach($category->getProducts($session) as $product) {
                if($slot > 43) {
                    break 2;
                }

                $item = VanillaItems::NETHER_STAR()->setCustomName($product->getDisplayName($session));
                $inventory->setItem($slot, $item);
                $productsBySlot[$slot] = $product;
                $slot++;
            }
        }

        $menu->setListener(InvMenu::readonly(function(InvMenuTransaction $transaction) use ($session, $productsBySlot): void {
            $slot = $transaction->getAction()->getSlot();
            if(!isset($productsBySlot[$slot])) {
                return;
            }

            if(self::purchase($session, $productsBySlot[$slot])) {
                $transaction->getPlayer()->removeCurrentWindow();
                self::openUpgradesShop($session);
            }
        }));

        $menu->send($session->getPlayer());
    }

    private static function purchase(Session $session, ItemProduct|UpgradesProduct $product): bool {
        if(!$product->canBePurchased($session)) {
            $session->message("{RED}You already have this product!");
            return false;
        }

        $ore = $product->getOre();
        $inventory = $session->getPlayer()->getInventory();
        if(!$inventory->contains($ore)) {
            $session->message("{RED}You don't have enough " . TextFormat::clean($ore->getName()) . "!");
            return false;
        }

        if(!$product->onPurchase($session)) {
            return false;
        }

        $inventory->removeItem($ore);
        $session->message("{GREEN}You purchased {GOLD}" . TextFormat::clean($product->getName()));
        return true;
    }

    /** @return array<string, ItemProduct> */
    private static function buildItemLookup(Session $session, ItemShop $shop): array {
        $lookup = [];
        foreach($shop->getCategories() as $category) {
            foreach($category->getProducts($session) as $product) {
                $lookup[$product->getId()] = $product;
            }
        }
        return $lookup;
    }
}
