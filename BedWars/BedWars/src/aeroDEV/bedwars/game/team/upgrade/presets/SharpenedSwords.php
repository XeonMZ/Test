<?php

declare(strict_types=1);

namespace aeroDEV\bedwars\game\team\upgrade\presets;

use aeroDEV\bedwars\game\team\upgrade\Upgrade;
use aeroDEV\bedwars\session\Session;
use pocketmine\item\Sword;
use pocketmine\item\enchantment\EnchantmentInstance;
use pocketmine\item\enchantment\VanillaEnchantments;

class SharpenedSwords extends Upgrade {

    public function getName(): string {
        return "Sharpened Swords";
    }

    public function getLevels(): int {
        return 1;
    }

    protected function internalApplySession(Session $session): void {
        $this->apply($session);
    }

    public function apply(Session $session): void {
        $inventory = $session->getPlayer()->getInventory();

        foreach($inventory->getContents() as $slot => $item) {
            if($item instanceof Sword) {
                $item->addEnchantment(new EnchantmentInstance(VanillaEnchantments::SHARPNESS(), 1));
                $inventory->setItem($slot, $item);
            }
        }
    }
}
