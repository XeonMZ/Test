<?php

declare(strict_types=1);

namespace aeroDEV\bedwars\provider\mysql\task;

use aeroDEV\bedwars\provider\mysql\MysqlAsyncTask;
use aeroDEV\bedwars\session\Session;
use aeroDEV\bedwars\session\SessionFactory;
use aeroDEV\bedwars\session\settings\SpectatorSettings;
use mysqli;

class LoadSessionTask extends MysqlAsyncTask {

    private string $xuid;
    private string $username;

    public function __construct(Session $session) {
        $this->xuid = $session->getPlayer()->getXuid();
        $this->username = $session->getUsername();
        parent::__construct();
    }

    protected function onConnection(mysqli $mysqli): void {
        $this->insertIfNotExists($mysqli);
        $this->updateUsername($mysqli);
        $this->fetchUserDetails($mysqli);
    }

    private function insertIfNotExists(mysqli $mysqli): void {
        $stmt = $mysqli->prepare("INSERT IGNORE INTO bedwars_users (xuid, username, coins, kills, wins, flying_speed, auto_teleport, night_vision) VALUES (?, ?, 0, 0, 0, 0, true, true)");
        $stmt->bind_param("ss", ...[$this->xuid, $this->username]);
        $stmt->execute();
        $stmt->close();
    }

    private function updateUsername(mysqli $mysqli): void {
        $stmt = $mysqli->prepare("UPDATE bedwars_users SET username = ? WHERE xuid = ?");
        $stmt->bind_param("ss", ...[$this->username, $this->xuid]);
        $stmt->execute();
        $stmt->close();
    }

    private function fetchUserDetails(mysqli $mysqli): void {
        $stmt = $mysqli->prepare("SELECT * FROM bedwars_users WHERE xuid = ?");
        $stmt->bind_param("s", ...[$this->xuid]);
        $stmt->execute();
        $result = $stmt->get_result();

        $rows = $result->fetch_all(MYSQLI_ASSOC);
        $this->setResult($rows);

        $stmt->free_result();
        $stmt->close();
    }

    public function onCompletion(): void {
        $session = SessionFactory::getSessionByName($this->username);
        if($session === null) {
            return;
        }

        $rows = $this->getResult();
        if(!isset($rows[0])) {
            return;
        }

        $data = $rows[0];

        $session->setKills((int) $data["kills"]);
        $session->setWins((int) $data["wins"]);
        $session->setCoins((int) $data["coins"]);
        $session->setSpectatorSettings(SpectatorSettings::fromData($session, $data));

        if(method_exists($session, "setLeaderboardStats")) {
            $session->setLeaderboardStats([
                "solo" => ["kills" => (int) ($data["kills_solo"] ?? 0), "wins" => (int) ($data["wins_solo"] ?? 0)],
                "duo" => ["kills" => (int) ($data["kills_duo"] ?? 0), "wins" => (int) ($data["wins_duo"] ?? 0)],
                "squad" => ["kills" => (int) ($data["kills_squad"] ?? 0), "wins" => (int) ($data["wins_squad"] ?? 0)]
            ]);
        }
    }
}
