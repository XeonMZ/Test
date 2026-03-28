<?php

declare(strict_types=1);


namespace aeroDEV\bedwars\form\queue;


use aeroDEV\bedwars\BedWars;
use aeroDEV\bedwars\form\queue\element\PlayGameButton;
use aeroDEV\bedwars\game\map\MapFactory;
use aeroDEV\bedwars\utils\GameUtils;

class PlayBedwarsForm extends \dresnite\EasyUI\variant\SimpleForm {

    private int $players_per_team;

    public function __construct(int $players_per_team) {
        $this->players_per_team = $players_per_team;
        parent::__construct("Play bedwars " . GameUtils::getMode($players_per_team));
    }

    protected function onCreation(): void {
        $maps = MapFactory::getMapsByPlayers($this->players_per_team);
        $players = 0;
        foreach($maps as $map) {
            foreach(BedWars::getInstance()->getGameManager()->getGamesByMap($map) as $game) {
                $players += $game->getPlayersCount();
            }
        }

        $button = new PlayGameButton("Play game\nPlayers: " . $players, BedWars::getInstance()->getGameManager()->findRandomGame($this->players_per_team));
        $this->addButton($button);

    }

}
