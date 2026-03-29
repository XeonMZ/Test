<?php

declare(strict_types=1);

namespace aeroDEV\bedwars\provider\sqlite;

use aeroDEV\bedwars\BedWars;
use aeroDEV\bedwars\provider\Provider;
use aeroDEV\bedwars\session\Session;
use aeroDEV\bedwars\session\settings\SpectatorSettings;
use SQLite3;

class SqliteProvider extends Provider {

    private SQLite3 $sqlite;

    public function __construct() {
        $this->sqlite = new SQLite3(BedWars::getInstance()->getDataFolder() . "database.db");
        $this->sqlite->exec(
            "CREATE TABLE IF NOT EXISTS bedwars_users (
                xuid VARCHAR(16) PRIMARY KEY,
                username TEXT DEFAULT '',
                coins INT,
                kills INT,
                wins INT,
                kills_solo INT DEFAULT 0,
                kills_duo INT DEFAULT 0,
                kills_squad INT DEFAULT 0,
                wins_solo INT DEFAULT 0,
                wins_duo INT DEFAULT 0,
                wins_squad INT DEFAULT 0,
                flying_speed INT,
                auto_teleport BOOL,
                night_vision BOOL
            );"
        );

        $this->sqlite->exec("ALTER TABLE bedwars_users ADD COLUMN username TEXT DEFAULT ''");
        $this->sqlite->exec("ALTER TABLE bedwars_users ADD COLUMN kills_solo INT DEFAULT 0");
        $this->sqlite->exec("ALTER TABLE bedwars_users ADD COLUMN kills_duo INT DEFAULT 0");
        $this->sqlite->exec("ALTER TABLE bedwars_users ADD COLUMN kills_squad INT DEFAULT 0");
        $this->sqlite->exec("ALTER TABLE bedwars_users ADD COLUMN wins_solo INT DEFAULT 0");
        $this->sqlite->exec("ALTER TABLE bedwars_users ADD COLUMN wins_duo INT DEFAULT 0");
        $this->sqlite->exec("ALTER TABLE bedwars_users ADD COLUMN wins_squad INT DEFAULT 0");
    }

    public function loadSession(Session $session): void {
        $xuid = $session->getPlayer()->getXuid();
        $this->insertIfNotExists($xuid, $session->getUsername());
        $this->updateUsername($xuid, $session->getUsername());

        $data = $this->fetchUserDetails($xuid);

        $session->setCoins((int) $data["coins"]);
        $session->setKills((int) $data["kills"]);
        $session->setWins((int) $data["wins"]);
        $session->setSpectatorSettings(SpectatorSettings::fromData($session, $data));

        if(method_exists($session, "setLeaderboardStats")) {
            $session->setLeaderboardStats([
                "solo" => ["kills" => (int) ($data["kills_solo"] ?? 0), "wins" => (int) ($data["wins_solo"] ?? 0)],
                "duo" => ["kills" => (int) ($data["kills_duo"] ?? 0), "wins" => (int) ($data["wins_duo"] ?? 0)],
                "squad" => ["kills" => (int) ($data["kills_squad"] ?? 0), "wins" => (int) ($data["wins_squad"] ?? 0)],
            ]);
        }
    }

    public function updateCoins(Session $session): void {
        $this->updateProperty($session, "coins");
    }

    public function updateKills(Session $session): void {
        $this->updateProperty($session, "kills");
        $this->syncLeaderboardStats($session);
    }

    public function updateWins(Session $session): void {
        $this->updateProperty($session, "wins");
        $this->syncLeaderboardStats($session);
    }

    private function insertIfNotExists(string $xuid, string $username): void {
        $stmt = $this->sqlite->prepare("INSERT OR IGNORE INTO bedwars_users (xuid, username, coins, kills, wins, kills_solo, kills_duo, kills_squad, wins_solo, wins_duo, wins_squad, flying_speed, auto_teleport, night_vision) VALUES (:xuid, :username, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, true, true)");
        $stmt->bindParam(":xuid", $xuid);
        $stmt->bindParam(":username", $username);
        $stmt->execute();
    }

    private function updateUsername(string $xuid, string $username): void {
        $stmt = $this->sqlite->prepare("UPDATE bedwars_users SET username = :username WHERE xuid = :xuid");
        $stmt->bindValue(":username", $username);
        $stmt->bindValue(":xuid", $xuid);
        $stmt->execute();
    }

    private function fetchUserDetails(string $xuid): array {
        $stmt = $this->sqlite->prepare("SELECT * FROM bedwars_users WHERE xuid = :xuid");
        $stmt->bindParam(":xuid", $xuid);
        $result = $stmt->execute();

        return $result->fetchArray(SQLITE3_ASSOC);
    }

    private function updateProperty(Session $session, string $property): void {
        $stmt = $this->sqlite->prepare("UPDATE bedwars_users SET $property = :value WHERE xuid = :xuid");
        $stmt->bindValue(":value", $session->{'get' . ucfirst($property)}());
        $stmt->bindValue(":xuid", $session->getPlayer()->getXuid());
        $stmt->execute();
    }

    private function syncLeaderboardStats(Session $session): void {
        if(!method_exists($session, "getLeaderboardStats")) {
            return;
        }

        $stats = $session->getLeaderboardStats();
        $stmt = $this->sqlite->prepare("UPDATE bedwars_users SET kills_solo = :ks, kills_duo = :kd, kills_squad = :kq, wins_solo = :ws, wins_duo = :wd, wins_squad = :wq WHERE xuid = :xuid");
        $stmt->bindValue(":ks", (int) ($stats["solo"]["kills"] ?? 0));
        $stmt->bindValue(":kd", (int) ($stats["duo"]["kills"] ?? 0));
        $stmt->bindValue(":kq", (int) ($stats["squad"]["kills"] ?? 0));
        $stmt->bindValue(":ws", (int) ($stats["solo"]["wins"] ?? 0));
        $stmt->bindValue(":wd", (int) ($stats["duo"]["wins"] ?? 0));
        $stmt->bindValue(":wq", (int) ($stats["squad"]["wins"] ?? 0));
        $stmt->bindValue(":xuid", $session->getPlayer()->getXuid());
        $stmt->execute();
    }

    public function saveSession(Session $session): void {
        $this->updateCoins($session);
        $this->updateKills($session);
        $this->updateWins($session);
    }
}
