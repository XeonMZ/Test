<?php

declare(strict_types=1);


namespace aeroDEV\bedwars\session\scoreboard;


use pocketmine\Server;
use aeroDEV\bedwars\session\Session;
use function date;

class LobbyScoreboard extends Scoreboard {

    protected function getLines(Session $session): array {
        return [
            10 => "{GRAY}" . date("d/m/Y"),
            9 => " ",
            8 => "{WHITE}Name : " . $session->getUsername(),
            7 => "{WHITE}Rank : " . $this->getPurePermsRank($session),
            6 => "  ",
            5 => "{YELLOW}Stats :",
            4 => "{WHITE}Total Wins : " . $session->getWins(),
            3 => "{WHITE}Total Kills : " . $session->getKills(),
        ];
    }

    protected function getTitle(Session $session): string {
        return "{BOLD}{YELLOW}LOBBY";
    }

    private function getPurePermsRank(Session $session): string {
        $player = $session->getPlayer();
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
