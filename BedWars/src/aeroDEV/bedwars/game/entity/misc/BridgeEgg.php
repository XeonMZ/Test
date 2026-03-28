<?php

declare(strict_types=1);

namespace aeroDEV\bedwars\game\entity\misc;

use aeroDEV\bedwars\session\SessionFactory;
use pocketmine\block\Air;
use pocketmine\block\VanillaBlocks;
use pocketmine\entity\EntitySizeInfo;
use pocketmine\entity\projectile\Throwable;
use pocketmine\event\entity\ProjectileHitEvent;
use pocketmine\math\Vector3;
use pocketmine\network\mcpe\protocol\types\entity\EntityIds;
use pocketmine\player\Player;
use pocketmine\world\Position;

class BridgeEgg extends Throwable {

    private int $last_place_tick = 0;

    public static function getNetworkTypeId(): string {
        return EntityIds::EGG;
    }

    protected function getInitialSizeInfo(): EntitySizeInfo {
        return new EntitySizeInfo(0.25, 0.25);
    }

    public function onUpdate(int $currentTick): bool {
        $has_update = parent::onUpdate($currentTick);
        if($this->isClosed()) {
            return $has_update;
        }

        if($currentTick - $this->last_place_tick >= 1) {
            $this->last_place_tick = $currentTick;
            $this->placeBridgeAt($this->getPosition()->asVector3()->floor());
        }
        return $has_update;
    }

    private function placeBridgeAt(Vector3 $position): void {
        $owner = $this->getOwningEntity();
        if(!$owner instanceof Player) {
            return;
        }
        $session = SessionFactory::getSession($owner);
        if($session === null || !$session->isPlaying() || !$session->hasTeam()) {
            return;
        }

        $world = $this->getWorld();
        $bridge_block = VanillaBlocks::WOOL()->setColor($session->getTeam()->getDyeColor());

        $targets = [
            $position->add(0, -1, 0),
            $position->add(1, -1, 0),
            $position->add(-1, -1, 0)
        ];

        foreach($targets as $target) {
            $current = $world->getBlock($target);
            if(!$current instanceof Air) {
                continue;
            }
            $world->setBlock($target, clone $bridge_block);
            $session->getGame()->addBlock(new Position($target->getX(), $target->getY(), $target->getZ(), $world));
        }
    }

    protected function onHit(ProjectileHitEvent $event): void {
        $this->placeBridgeAt($event->getRayTraceResult()->getHitVector()->floor());
    }
}
