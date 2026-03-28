<?php

declare(strict_types=1);


namespace aeroDEV\bedwars\session\scoreboard;


use aeroDEV\bedwars\game\stage\PlayingStage;
use aeroDEV\bedwars\game\team\Team;
use aeroDEV\bedwars\session\Session;
use aeroDEV\bedwars\utils\ColorUtils;
use function date;
use function gmdate;

class GameScoreboard extends Scoreboard {

    protected function getLines(Session $session): array {
        if(!$session->hasGame()) {
            return [];
        }

        $stage = $session->getGame()->getStage();
        if(!$stage instanceof PlayingStage) {
            return [];
        }
        $event = $stage->getNextEvent();

        return [
            14 => "{GRAY}" . date("m/d/y"),
            13 => " ",
            12 => "{WHITE}" . $event->getName() . " in: {GREEN}" . gmdate("i:s", $event->getTimeRemaining()) . "   ",
            11 => "  ",
        ] + $this->getTeams($session);
    }

    private function getTeams(Session $session): array {
        $teams = [];
        $score = 10;
        foreach($session->getGame()->getTeams() as $team) {
            $teams[$score] = ColorUtils::translate(
                $team->getColor() . $team->getFirstLetter() . " {WHITE}" . $team->getName() . ": " .
                $this->getBedStatus($team) . ($team->hasMember($session) ? " {GRAY}YOU" : " ")
            );
            $score--;
        }

        return $teams;
    }

    private function getBedStatus(Team $team): string {
        if(!$team->isAlive()) {
            return "{RED}X";
        }
        if($team->isBedDestroyed()) {
            return "{GREEN}✓ {GRAY}(" . $team->getMembersCount() . ")";
        }
        return "{GREEN}✓";
    }

}