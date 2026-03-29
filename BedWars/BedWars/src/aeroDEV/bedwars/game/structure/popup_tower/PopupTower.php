<?php

declare(strict_types=1);

namespace aeroDEV\bedwars\game\structure\popup_tower;

use aeroDEV\bedwars\BedWars;
use aeroDEV\bedwars\game\Game;
use aeroDEV\bedwars\session\Session;
use pocketmine\block\Air;
use pocketmine\math\Vector3;

class PopupTower {

    public static function place(Session $session, Vector3 $base): bool {
        $game = $session->getGame();
        if(!$game instanceof Game) {
            return false;
        }

        $player = $session->getPlayer();
        $world = $player->getWorld();
        $instructions = TowerInstructions::forFacing($player->getHorizontalFacing());
        $towerBlock = self::getTowerMaterialByTier($session);

        foreach($instructions as [$x, $y, $z, $ladderFacing]) {
            $target = $base->add($x, $y, $z);
            if(!$world->getBlock($target) instanceof Air) {
                $session->message("{RED}Cannot place Popup Tower due to collision with map block(s)");
                return false;
            }
        }

        BedWars::getInstance()->getScheduler()->scheduleRepeatingTask(
            new TowerConstructTask($world, $base, $instructions, $towerBlock, $game),
            1
        );
        return true;
    }

    private static function getTowerMaterialByTier(Session $session): \pocketmine\block\Block {
        $tier = $session->getTeam()->getUpgrades()->getTowerOfHope()->getLevel();
        if($tier >= 2) {
            return \pocketmine\block\VanillaBlocks::END_STONE();
        }
        if($tier >= 1) {
            if(method_exists(\pocketmine\block\VanillaBlocks::class, "STAINED_HARDENED_CLAY")) {
                return \pocketmine\block\VanillaBlocks::STAINED_HARDENED_CLAY()->setColor($session->getTeam()->getDyeColor());
            }
            return \pocketmine\block\VanillaBlocks::TERRACOTTA();
        }
        return \pocketmine\block\VanillaBlocks::WOOL()->setColor($session->getTeam()->getDyeColor());
    }
}
