<?php

declare(strict_types=1);

namespace aeroDEV\bedwars\form\shop\invmenu;

use aeroDEV\bedwars\game\shop\Category;
use aeroDEV\bedwars\game\shop\Product;
use aeroDEV\bedwars\game\shop\item\ItemShop;
use aeroDEV\bedwars\game\shop\quickbuy\QuickBuyManager;
use aeroDEV\bedwars\game\shop\upgrades\UpgradesShop;
use aeroDEV\bedwars\session\Session;
use muqsit\invmenu\InvMenu;
use pocketmine\item\Item;
use pocketmine\item\VanillaItems;
use pocketmine\utils\TextFormat;
use pocketmine\world\sound\ClickSound;
use pocketmine\world\sound\PopSound;
use pocketmine\world\sound\XpCollectSound;

final class InvMenuShopUI {

    /** @var array<string, array<string, Product>> */
    private static array $item_lookup_cache = [];

    public static function openItemShop(Session $session) : void {
        $menu = InvMenu::create(InvMenu::TYPE_DOUBLE_CHEST);
        $menu->setName("§l§6Item Shop");

        $inventory = $menu->getInventory();
        $products_by_slot = [];
        $quick_slots = [18, 19, 20, 21, 22, 23, 24, 25, 26];

        $layout = QuickBuyManager::getLayout($session);
        $lookup = self::buildItemLookup($session);

        $categories = array_values((new ItemShop())->getCategories());
        foreach($categories as $slot => $category) {
            $icon = self::getItemCategoryIcon($category->getName());
            $icon->setCustomName("§a§l" . $category->getName());
            $icon->setLore(["§7Buka kategori " . TextFormat::clean($category->getName())]);
            $inventory->setItem($slot, $icon);
        }

        foreach($quick_slots as $i => $slot) {
            $product_id = $layout[$i] ?? null;
            if($product_id === null || !isset($lookup[$product_id])) {
                $inventory->setItem($slot, VanillaItems::BARRIER()->setCustomName("§7Empty Quick Buy"));
                continue;
            }

            $product = $lookup[$product_id];
            $item = $product->getItem()->setCustomName($product->getDisplayName($session));
            $item->setLore([TextFormat::clean($product->getDescription($session)), "§eKlik untuk membeli"]);
            $inventory->setItem($slot, $item);
            $products_by_slot[$slot] = $product;
        }

        $menu->setListener(function($transaction) use ($session, $products_by_slot, $categories) {
            $slot = $transaction->getAction()->getSlot();
            $player = $session->getPlayer();

            if(isset($categories[$slot])) {
                self::openItemCategory($session, $categories[$slot]);
                return $transaction->discard();
            }

            if(isset($products_by_slot[$slot])) {
                $success = self::purchaseProduct($session, $products_by_slot[$slot]);
                $player->getWorld()->addSound($player->getPosition(), $success ? new PopSound() : new ClickSound());
            }

            return $transaction->discard();
        });

        $menu->send($session->getPlayer());
    }

    public static function openItemCategory(Session $session, Category $category): void {
        $menu = InvMenu::create(InvMenu::TYPE_DOUBLE_CHEST);
        $menu->setName("§8" . $category->getName());

        $inventory = $menu->getInventory();
        $products = [];
        $slot = 0;

        $back = VanillaItems::ARROW()->setCustomName("§c← Back");
        $back->setLore(["§7Kembali ke Item Shop"]);
        $inventory->setItem(45, $back);

        foreach($category->getProducts($session) as $product) {
            $item = $product->getItem()->setCustomName($product->getDisplayName($session));
            $item->setLore([TextFormat::clean($product->getDescription($session)), "§eKlik untuk membeli"]);
            $inventory->setItem($slot, $item);
            $products[$slot] = $product;
            ++$slot;
        }

        $menu->setListener(function($transaction) use ($session, $products) {
            $slot = $transaction->getAction()->getSlot();
            $player = $session->getPlayer();

            if($slot === 45) {
                self::openItemShop($session);
                return $transaction->discard();
            }

            if(isset($products[$slot])) {
                $success = self::purchaseProduct($session, $products[$slot]);
                if($success) {
                    $player->getWorld()->addSound($player->getPosition(), new XpCollectSound());
                    $player->getWorld()->addSound($player->getPosition(), new PopSound());
                } else {
                    $player->getWorld()->addSound($player->getPosition(), new ClickSound());
                }
            }

            return $transaction->discard();
        });

        $menu->send($session->getPlayer());
    }

    private static function buildItemLookup(Session $session): array {
        $xuid = $session->getPlayer()->getXuid();
        if(isset(self::$item_lookup_cache[$xuid])) {
            return self::$item_lookup_cache[$xuid];
        }

        $lookup = [];
        foreach((new ItemShop())->getCategories() as $category) {
            foreach($category->getProducts($session) as $product) {
                $lookup[$product->getId()] = $product;
            }
        }
        self::$item_lookup_cache[$xuid] = $lookup;
        return $lookup;
    }

    public static function openUpgradesShop(Session $session): void {
        $menu = InvMenu::create(InvMenu::TYPE_CHEST);
        $menu->setName("§l§bUpgrades Shop");

        $inventory = $menu->getInventory();
        $categories = array_values((new UpgradesShop())->getCategories());

        foreach($categories as $slot => $category) {
            $icon = self::getUpgradeCategoryIcon($category->getName());
            $icon->setCustomName("§b§l" . $category->getName());
            $icon->setLore(["§7Buka kategori upgrade"]);
            $inventory->setItem($slot, $icon);
        }

        $menu->setListener(function($transaction) use ($session, $categories) {
            $slot = $transaction->getAction()->getSlot();
            if(isset($categories[$slot])) {
                self::openUpgradeCategory($session, $categories[$slot]);
            }
            return $transaction->discard();
        });

        $menu->send($session->getPlayer());
    }

    public static function openUpgradeCategory(Session $session, Category $category): void {
        $menu = InvMenu::create(InvMenu::TYPE_CHEST);
        $menu->setName("§8" . $category->getName());

        $inventory = $menu->getInventory();
        $products = [];
        $slot = 0;

        $back = VanillaItems::ARROW()->setCustomName("§c← Back");
        $back->setLore(["§7Kembali ke Upgrades Shop"]);
        $inventory->setItem(8, $back);

        foreach($category->getProducts($session) as $product) {
            $item = self::getUpgradeCategoryIcon($category->getName());
            $item->setCustomName($product->getDisplayName($session));
            $item->setLore([TextFormat::clean($product->getDescription($session)), "§eKlik untuk membeli"]);
            $inventory->setItem($slot, $item);
            $products[$slot] = $product;
            ++$slot;
        }

        $menu->setListener(function($transaction) use ($session, $products) {
            $slot = $transaction->getAction()->getSlot();
            $player = $session->getPlayer();

            if($slot === 8) {
                self::openUpgradesShop($session);
                return $transaction->discard();
            }

            if(isset($products[$slot])) {
                $success = self::purchaseProduct($session, $products[$slot]);
                if($success) {
                    $player->getWorld()->addSound($player->getPosition(), new XpCollectSound());
                    $player->getWorld()->addSound($player->getPosition(), new PopSound());
                } else {
                    $player->getWorld()->addSound($player->getPosition(), new ClickSound());
                }
            }

            return $transaction->discard();
        });

        $menu->send($session->getPlayer());
    }

    private static function purchaseProduct(Session $session, Product $product): bool {
        if(!$product->canBePurchased($session)) {
            $session->message("{RED}You already have this product!");
            return false;
        }

        $inventory = $session->getPlayer()->getInventory();
        $ore = $product->getOre();

        if(!$inventory->contains($ore)) {
            $count = 0;
            foreach($inventory->all($ore) as $item) {
                $count += $item->getCount();
            }
            $missing = $ore->getCount() - $count;
            $session->message(TextFormat::RED . "You don't have enough " . $ore->getName() . "! Need $missing more!");
            return false;
        }

        if(!$product->onPurchase($session)) {
            return false;
        }

        $inventory->removeItem($ore);
        $session->message("{GREEN}You purchased {GOLD}" . TextFormat::clean($product->getName()));
        return true;
    }

    private static function getItemCategoryIcon(string $name): Item {
        $normalized = strtolower(TextFormat::clean($name));
        return match(true) {
            str_contains($normalized, "block") => self::vanillaItem("BRICK", "CLAY_BRICK", "COBBLESTONE"),
            str_contains($normalized, "melee"), str_contains($normalized, "sword") => self::vanillaItem("IRON_SWORD", "STONE_SWORD"),
            str_contains($normalized, "armor"), str_contains($normalized, "armour") => self::vanillaItem("IRON_CHESTPLATE", "LEATHER_CHESTPLATE"),
            str_contains($normalized, "tool") => self::vanillaItem("IRON_PICKAXE", "STONE_PICKAXE"),
            str_contains($normalized, "range"), str_contains($normalized, "bow") => self::vanillaItem("BOW", "ARROW"),
            str_contains($normalized, "potion") => self::vanillaItem("POTION", "GLASS_BOTTLE"),
            str_contains($normalized, "misc"), str_contains($normalized, "utility") => self::vanillaItem("TNT", "FIRE_CHARGE"),
            default => self::vanillaItem("NETHER_STAR", "PAPER")
        };
    }

    private static function getUpgradeCategoryIcon(string $name): Item {
        $normalized = strtolower(TextFormat::clean($name));
        return match(true) {
            str_contains($normalized, "upgrade") => self::vanillaItem("DIAMOND_SWORD", "IRON_SWORD"),
            str_contains($normalized, "trap") => self::vanillaItem("STRING", "SPIDER_EYE"),
            default => self::vanillaItem("NETHER_STAR", "PAPER")
        };
    }

    private static function vanillaItem(string ...$methods): Item {
        foreach($methods as $method) {
            if(method_exists(VanillaItems::class, $method)) {
                /** @var Item $item */
                $item = VanillaItems::{$method}();
                return $item;
            }
        }
        return method_exists(VanillaItems::class, "PAPER") ? VanillaItems::PAPER() : VanillaItems::AIR();
    }
}
