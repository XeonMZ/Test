<?php

declare(strict_types=1);

namespace aeroDEV\bedwars\game\structure\popup_tower;

use pocketmine\math\Facing;

final class TowerInstructions {

    /** @return array<int,array{int,int,int,int|null}> */
    public static function forFacing(int $facing): array {
        $ladderFacing = match($facing) {
            Facing::NORTH => Facing::SOUTH,
            Facing::SOUTH => Facing::NORTH,
            Facing::WEST => Facing::EAST,
            Facing::EAST => Facing::WEST,
            default => Facing::SOUTH
        };

        return [
            [0, 0, 0, null], [1, 0, 0, null], [-1, 0, 0, null], [0, 0, 1, null], [0, 0, -1, null],
            [0, 1, 0, null], [1, 1, 1, null], [1, 1, -1, null], [-1, 1, 1, null], [-1, 1, -1, null], [0, 1, -1, $ladderFacing],
            [0, 2, 0, null], [1, 2, 0, null], [-1, 2, 0, null], [0, 2, 1, null], [0, 2, -1, null], [0, 2, -1, $ladderFacing],
            [0, 3, 0, null], [1, 3, 1, null], [1, 3, -1, null], [-1, 3, 1, null], [-1, 3, -1, null], [0, 3, -1, $ladderFacing],
            [0, 4, 0, null], [1, 4, 0, null], [-1, 4, 0, null], [0, 4, 1, null], [0, 4, -1, null], [0, 4, -1, $ladderFacing],
            [0, 5, 0, null], [1, 5, 0, null], [-1, 5, 0, null], [0, 5, 1, null], [0, 5, -1, null]
        ];
    }
}
