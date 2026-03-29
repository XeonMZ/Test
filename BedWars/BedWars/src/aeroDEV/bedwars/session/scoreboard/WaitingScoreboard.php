<?php

declare(strict_types=1);


namespace aeroDEV\bedwars\session\scoreboard;


use aeroDEV\bedwars\game\Game;
use aeroDEV\bedwars\game\stage\StartingStage;
use aeroDEV\bedwars\session\Session;
use aeroDEV\bedwars\utils\GameUtils;
use function date;

class WaitingScoreboard extends Scoreboard {

    protected function getLines(Session $session): array {
        $game = $session->getGame();
        $map = $game->getMap();
        $stage = $game->getStage();
        $lockedMap = $stage instanceof StartingStage ? $map->getName() : "Unknown";

        return [
            10 => "{GRAY}" . date("d/m/Y"),
            9 => " ",
            8 => "{WHITE}Map : " . $lockedMap,
            7 => "{WHITE}Players : " . $game->getPlayersCount() . "/" . $map->getMaxCapacity(),
            6 => !$stage instanceof StartingStage ? "{WHITE}Waiting..." : "{WHITE}Starting in {GREEN}" . $stage->getCountdown() . "s",
            5 => "   ",
            4 => "{WHITE}Mode : " . GameUtils::getMode($map->getPlayersPerTeam())
        ];
    }

    protected function getTitle(Session $session): string {
        return "{BOLD}{YELLOW}Arena Lobby";
    }
}
