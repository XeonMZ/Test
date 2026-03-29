<?php

declare(strict_types=1);

namespace aeroDEV\bedwars\game\team\upgrade\presets;

use pocketmine\item\enchantment\EnchantmentInstance;

use pocketmine\item\enchantment\VanillaEnchantments;

use aeroDEV\bedwars\game\team\upgrade\Upgrade;

use aeroDEV\bedwars\session\Session;

class ArmorProtection extends Upgrade {

    public function getName(): string {

        return "Armor Protection";

    }

    public function getLevels(): int {

        return 4;

    }

    protected function internalApplySession(Session $session): void {
        $session->getGameSettings()->setArmor($session->getGameSettings()->getArmor());
        $inventory = $session->getPlayer()->getArmorInventory();
        foreach($inventory->getContents() as $index => $item) {
            if(!$item->hasEnchantment(VanillaEnchantments::PROTECTION())) {
                $item->addEnchantment(new EnchantmentInstance(VanillaEnchantments::PROTECTION(), $this->level));
            }
            $inventory->setItem($index, $item);
        }
    }

}
