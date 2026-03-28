<?php

declare(strict_types=1);

namespace aeroDEV\bedwars\leaderboard;

interface LeaderboardStorage {

    /**
     * @return array<int, array{name:string, value:int}>
     */
    public function getTop(string $variable, string $mode, int $limit = 10): array;
}
