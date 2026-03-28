<?php

declare(strict_types=1);

namespace aeroDEV\bedwars\form\queue;

use dresnite\EasyUI\element\Button;
use dresnite\EasyUI\variant\SimpleForm;
use pocketmine\player\Player;
use aeroDEV\bedwars\game\map\MapFactory;
use aeroDEV\bedwars\session\Session;
use aeroDEV\bedwars\session\SessionFactory;

class VoteMapForm extends SimpleForm {

    public function __construct(private Session $session) {
        parent::__construct("Vote Map");
    }

    protected function onCreation(): void {
        if(!$this->session->hasGame()) {
            return;
        }

        $game = $this->session->getGame();
        $summary = $game->getMapVotesSummary();

        foreach(MapFactory::getMapsByPlayers($game->getMap()->getPlayersPerTeam()) as $map) {
            $votes = $summary[$map->getName()] ?? 0;
            $button = new Button($map->getName() . "\nVotes: " . $votes);
            $button->setSubmitListener(function(Player $player) use ($map): void {
                $session = SessionFactory::getSession($player);
                if(!$session->hasGame()) {
                    return;
                }
                if($session->getGame()->voteMap($session, $map)) {
                    $session->message("{GREEN}Kamu vote map: {YELLOW}" . $map->getName());
                    $session->getGame()->updateScoreboards();
                    return;
                }
                $session->message("{RED}Vote map sudah dikunci.");
            });
            $this->addButton($button);
        }
    }
}
