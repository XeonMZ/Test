<?php

declare(strict_types=1);


namespace aeroDEV\bedwars\form\setup;


use dresnite\EasyUI\element\Button;
use pocketmine\player\Player;
use aeroDEV\bedwars\form\SimpleForm;
use aeroDEV\bedwars\session\Session;
use aeroDEV\bedwars\session\setup\builder\TeamBuilder;
use aeroDEV\bedwars\session\setup\step\area\SetClaimStep;
use aeroDEV\bedwars\session\setup\step\area\SetZoneStep;
use aeroDEV\bedwars\session\setup\step\SetBedPositionStep;
use aeroDEV\bedwars\session\setup\step\SetTeamGeneratorStep;
use aeroDEV\bedwars\session\setup\step\Step;

class TeamOptionsForm extends SimpleForm {

    private Session $session;
    private TeamBuilder $team;

    public function __construct(Session $session, TeamBuilder $team) {
        $this->session = $session;
        $this->team = $team;
        parent::__construct("What do you want to do?");
    }

    protected function onCreation(): void {
        $this->addSetSpawnPointButton();
        $this->addStepButton("Set generator", new SetTeamGeneratorStep($this->team));
        $this->addStepButton("Set bed", new SetBedPositionStep($this->team));
        $this->addStepButton("Set zone", new SetZoneStep($this->team));
        $this->addStepButton("Set claim", new SetClaimStep($this->team));
    }

    private function addSetSpawnPointButton(): void {
        $button = new Button("Set spawn point\nThis will set the spawn point in your location");
        $button->setSubmitListener(function(Player $player) {
            $position = $player->getPosition();

            $this->team->setSpawnPoint($position);

            $this->session->message("{GREEN}Spawn point set on: " . $this->vectorToString($player->getPosition()));
        });
        $this->addButton($button);
    }

    private function addStepButton(string $name, Step $step): void {
        $button = new Button($name);
        $button->setSubmitListener(function(Player $player) use ($step) {
            $this->session->getMapSetup()->setStep($step);
        });
        $this->addButton($button);

    }

}