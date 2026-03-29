<?php

declare(strict_types=1);

namespace aeroDEV\bedwars\game\structure\popup_tower;

use aeroDEV\bedwars\game\Game;
use pocketmine\block\Ladder;
use pocketmine\block\VanillaBlocks;
use pocketmine\math\Vector3;
use pocketmine\scheduler\Task;
use pocketmine\world\Position;
use pocketmine\world\World;

class TowerConstructTask extends Task {

    private int $next = 0;

    /** @param array<int,array{int,int,int,int|null}> $instructions */
    public function __construct(
        private World $world,
        private Vector3 $base,
        private array $instructions,
        private \pocketmine\block\Block $towerBlock,
        private Game $game
    ) {}

    public function onRun(): void {
        if(!isset($this->instructions[$this->next])) {
            $this->getHandler()?->cancel();
            return;
        }

        [$x, $y, $z, $ladderFacing] = $this->instructions[$this->next++];
        $target = $this->base->add($x, $y, $z);

        if($ladderFacing !== null) {
            $ladder = VanillaBlocks::LADDER();
            if($ladder instanceof Ladder) {
                $this->world->setBlock($target, $ladder->setFacing($ladderFacing));
            }
        } else {
            $this->world->setBlock($target, clone $this->towerBlock);
        }

        $this->game->addBlock(new Position($target->getX(), $target->getY(), $target->getZ(), $this->world));
    }
}
