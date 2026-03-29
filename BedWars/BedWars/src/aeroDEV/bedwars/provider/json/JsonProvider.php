<?php

declare(strict_types=1);

namespace aeroDEV\bedwars\provider\json;

use aeroDEV\bedwars\BedWars;
use aeroDEV\bedwars\provider\Provider;
use aeroDEV\bedwars\session\Session;
use aeroDEV\bedwars\session\settings\SpectatorSettings;
use pocketmine\utils\Config;
use function is_array;
use function is_dir;
use function mkdir;

class JsonProvider extends Provider {

    public function __construct() {
        $users_dir = $this->getUsersDir();
        if(!is_dir($users_dir)) {
            mkdir($users_dir);
        }
    }

    public function loadSession(Session $session): void {
        $config = $this->getSessionConfig($session);
        $session->setCoins((int) $config->get("coins"));
        $session->setKills((int) $config->get("kills"));
        $session->setWins((int) $config->get("wins"));
        $session->setSpectatorSettings(SpectatorSettings::fromData($session, (array) $config->get("spectator_settings")));

        if(method_exists($session, "setLeaderboardStats")) {
            $stats = $config->get("leaderboard", []);
            if(is_array($stats)) {
                $session->setLeaderboardStats($stats);
            } else {
                $session->setLeaderboardStats([
                    "solo" => ["kills" => 0, "wins" => 0],
                    "duo" => ["kills" => 0, "wins" => 0],
                    "squad" => ["kills" => (int) $config->get("kills"), "wins" => (int) $config->get("wins")]
                ]);
            }
        }

        $config->set("username", $session->getUsername());
        $config->save();
    }

    public function saveSession(Session $session): void {
        $config = $this->getSessionConfig($session);
        $config->set("username", $session->getUsername());
        $config->set("coins", $session->getCoins());
        $config->set("kills", $session->getKills());
        $config->set("wins", $session->getWins());
        $config->set("spectator_settings", [
            "flying_speed" => $session->getSpectatorSettings()->getFlyingSpeed(),
            "auto_teleport" => $session->getSpectatorSettings()->getAutoTeleport(),
            "night_vision" => $session->getSpectatorSettings()->getNightVision()
        ]);

        if(method_exists($session, "getLeaderboardStats")) {
            $config->set("leaderboard", $session->getLeaderboardStats());
        }

        $config->save();
    }

    public function updateCoins(Session $session): void {}

    public function updateKills(Session $session): void {
        $this->saveSession($session);
    }

    public function updateWins(Session $session): void {
        $this->saveSession($session);
    }

    private function getSessionConfig(Session $session): Config {
        return new Config($this->getUsersDir() . $session->getPlayer()->getXuid() . ".json", Config::JSON, [
            "username" => $session->getUsername(),
            "coins" => 0,
            "kills" => 0,
            "wins" => 0,
            "leaderboard" => [
                "solo" => ["kills" => 0, "wins" => 0],
                "duo" => ["kills" => 0, "wins" => 0],
                "squad" => ["kills" => 0, "wins" => 0]
            ],
            "spectator_settings" => [
                "flying_speed" => 0,
                "auto_teleport" => true,
                "night_vision" => true
            ]
        ]);
    }

    private function getUsersDir(): string {
        return BedWars::getInstance()->getDataFolder() . "users/";
    }
}
