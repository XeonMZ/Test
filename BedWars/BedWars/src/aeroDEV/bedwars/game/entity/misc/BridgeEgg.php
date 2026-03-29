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
    private ?Vector3 $start_position = null;

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

        if($this->start_position === null) {
            $this->start_position = $this->getPosition()->asVector3();
        }
        if($this->start_position !== null && $this->getPosition()->distance($this->start_position) > 20) {
            $this->flagForDespawn();
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
        $bridge_block = $this->getBridgeMaterial($session);
        $targets = [
            $position->add(0, -1, 0),
            $position->add(1, -1, 0),
            $position->add(-1, -1, 0),
            $position->add(0, -1, 1),
            $position->add(0, -1, -1)
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

    private function getBridgeMaterial(\aeroDEV\bedwars\session\Session $session): \pocketmine\block\Block {
        $level = $session->getTeam()->getUpgrades()->getBridgeOfLife()->getLevel();
        if($level >= 1) {
            if(method_exists(VanillaBlocks::class, "STAINED_HARDENED_CLAY")) {
                return VanillaBlocks::STAINED_HARDENED_CLAY()->setColor($session->getTeam()->getDyeColor());
            }
        }
        return VanillaBlocks::WOOL()->setColor($session->getTeam()->getDyeColor());
    }

    protected function onHit(ProjectileHitEvent $event): void {
        $this->placeBridgeAt($event->getRayTraceResult()->getHitVector()->floor());
    }
}
