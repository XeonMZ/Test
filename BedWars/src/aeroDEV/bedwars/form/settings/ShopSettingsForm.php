<?php

declare(strict_types=1);

namespace aeroDEV\bedwars\form\settings;

use dresnite\EasyUI\element\Button;
use dresnite\EasyUI\variant\SimpleForm;
use pocketmine\Server;
use pocketmine\player\Player;
use aeroDEV\bedwars\session\Session;
use aeroDEV\bedwars\session\SessionFactory;

class ShopSettingsForm extends SimpleForm {

    public function __construct(private Session $session) {
        parent::__construct("Settings", $this->getProfileText() . "

Pilih tampilan shop:");
    }

    protected function onCreation(): void {
        $default = new Button("UI Standar");
        $default->setSubmitListener(function(Player $player): void {
            $session = SessionFactory::getSession($player);
            $session->getGameSettings()->setUseChestShopUI(false);
            $session->message("{GREEN}UI shop diubah ke standar.");
        });
        $this->addButton($default);

        $chest = new Button("Chest UI");
        $chest->setSubmitListener(function(Player $player): void {
            $session = SessionFactory::getSession($player);
            $session->getGameSettings()->setUseChestShopUI(true);
            $session->message("{GREEN}UI shop diubah ke Chest UI.");
        });
        $this->addButton($chest);
    }

    private function getProfileText(): string {
        $player = $this->session->getPlayer();
        return "Name : " . $player->getName() . "
" .
            "Rank : " . $this->getPurePermsRank($player) . "
" .
            "Wins : " . $this->session->getWins() . "
" .
            "Kill : " . $this->session->getKills();
    }

    private function getPurePermsRank(Player $player): string {
        $plugin = Server::getInstance()->getPluginManager()->getPlugin("PurePerms");
        if($plugin === null || !method_exists($plugin, "getUserDataMgr")) {
            return "Member";
        }

        $userData = $plugin->getUserDataMgr()->getData($player);
        if($userData === null || !isset($userData["group"])) {
            return "Member";
        }
        return (string) $userData["group"];
    }
}
