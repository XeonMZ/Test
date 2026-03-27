<?php

declare(strict_types=1);

namespace aeroDEV\bedwars\form\queue;

use dresnite\EasyUI\element\Button;
use dresnite\EasyUI\variant\SimpleForm;
use pocketmine\player\Player;
use aeroDEV\bedwars\BedWars;
use aeroDEV\bedwars\game\map\MapFactory;
use aeroDEV\bedwars\session\Session;
use aeroDEV\bedwars\session\SessionFactory;
use function file_exists;
use function strtolower;

class VoteMapForm extends SimpleForm {

    public function __construct(private Session $session) {
        parent::__construct("§l§4BED§bWARS §f- Vote Map");
    }

    protected function onCreation(): void {
        if(!$this->session->hasGame()) {
            return;
        }

        $game = $this->session->getGame();
        $summary = $game->getMapVotesSummary();

        foreach(MapFactory::getMapsByPlayers($game->getMap()->getPlayersPerTeam()) as $map) {
            $votes = $summary[$map->getName()] ?? 0;
            $image = $this->getMapImageName($map->getName());
            $button = new Button("§l" . $map->getName() . "§r\n§7Votes: §e" . $votes . "\n§8Preview: " . $image);
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

    private function getMapImageName(string $mapName): string {
        $resourcePath = dirname(BedWars::getInstance()->getFile()) . "/resources";
        $normalized = strtolower($mapName) . ".png";
        if(file_exists($resourcePath . "/" . $normalized)) {
            return $normalized;
        }
        return "no.png";
    }
}
