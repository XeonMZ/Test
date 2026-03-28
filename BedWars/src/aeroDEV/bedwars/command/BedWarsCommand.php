<?php

declare(strict_types=1);


namespace aeroDEV\bedwars\command;


use pocketmine\command\Command;
use pocketmine\command\CommandSender;
use pocketmine\permission\DefaultPermissions;
use pocketmine\player\Player;
use pocketmine\plugin\Plugin;
use pocketmine\plugin\PluginOwned;
use aeroDEV\bedwars\BedWars;
use aeroDEV\bedwars\form\setup\BedwarsForm;
use aeroDEV\bedwars\game\stage\StartingStage;
use aeroDEV\bedwars\game\stage\WaitingStage;
use aeroDEV\bedwars\form\setup\SetupMapForm;
use aeroDEV\bedwars\session\SessionFactory;
use aeroDEV\bedwars\session\setup\step\PreparingMapStep;

class BedWarsCommand extends Command implements PluginOwned {

    public function __construct() {
        $this->setPermission(DefaultPermissions::ROOT_OPERATOR);
        parent::__construct("bedwars", "Setup your BedWars games!");
    }

    public function execute(CommandSender $sender, string $commandLabel, array $args): void {
        if(!$sender instanceof Player) {
            return;
        }

        $session = SessionFactory::getSession($sender);

        if(($args[0] ?? "") === "start") {
            if(!$session->isPlaying()) {
                $sender->sendMessage("§cKamu harus berada di game untuk memakai command ini.");
                return;
            }

            $game = $session->getGame();
            $stage = $game->getStage();
            if(!$stage instanceof WaitingStage and !$stage instanceof StartingStage) {
                $sender->sendMessage("§cGame ini sudah berjalan.");
                return;
            }

            $added = $game->addFakeSpectatorsForForceStart();
            if($stage instanceof WaitingStage) {
                $game->setStage(new StartingStage());
            }
            $game->broadcastMessage("{YELLOW}[FORCE START] {GREEN}" . $sender->getName() . " memulai game dengan {AQUA}" . $added . " {GREEN}fake player.");
            return;
        }

        if($session->isCreatingMap()) {
            if($session->getMapSetup()->getStep() instanceof PreparingMapStep) {
                $sender->sendForm(new SetupMapForm($session));
            }
        } else {
            $sender->sendForm(new BedwarsForm());
        }
    }

    public function getOwningPlugin(): Plugin {
        return BedWars::getInstance();
    }

}
