<?php

declare(strict_types=1);


namespace aeroDEV\bedwars\session\scoreboard;


use aeroDEV\bedwars\game\Game;
use aeroDEV\bedwars\game\stage\StartingStage;
use aeroDEV\bedwars\session\Session;
use aeroDEV\bedwars\utils\ConfigGetter;
use aeroDEV\bedwars\utils\GameUtils;
use function strtolower;
use function array_sum;

class WaitingScoreboard extends Scoreboard {

    protected function getLines(Session $session): array {
        $game = $session->getGame();
        $map = $game->getMap();
        $stage = $game->getStage();
        $totalVotes = array_sum($game->getMapVotesSummary());

        return [
            10 => " ",
            9 => "{WHITE}Map: {GREEN}" . $map->getName(),
            8 => "{WHITE}Players: {GREEN}" . $game->getPlayersCount() . "/" . $map->getMaxCapacity(),
            7 => "{WHITE}Votes: {GREEN}" . $totalVotes,
            6 => !$stage instanceof StartingStage ? "{WHITE}Waiting..." : "{WHITE}Starting in {GREEN}" . $stage->getCountdown() . "s",
            5 => "   ",
            4 => "{WHITE}Mode: {GREEN}" . GameUtils::getMode($map->getPlayersPerTeam()),
            3 => "{WHITE}Version: {GRAY}v" . ConfigGetter::getVersion()
        ];
    }

}