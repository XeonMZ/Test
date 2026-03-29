<?php

declare(strict_types=1);

namespace aeroDEV\bedwars\leaderboard\storage;

use aeroDEV\bedwars\leaderboard\LeaderboardStorageContract;
use aeroDEV\bedwars\provider\mysql\MysqlCredentials;

class MysqlLeaderboardStorage implements LeaderboardStorageContract {

    public function __construct(private MysqlCredentials $credentials) {}

    public function getTop(string $variable, string $mode, int $limit = 10): array {
        $mode = $this->normalizeMode($mode);
        $column = $this->resolveColumn($variable, $mode);

        $mysqli = $this->credentials->getMysqli();
        if($mysqli->connect_error) {
            return [];
        }

        $limit = max(1, $limit);
        $query = "SELECT COALESCE(NULLIF(username, ''), xuid) AS name, {$column} AS value FROM bedwars_users ORDER BY {$column} DESC LIMIT {$limit}";
        $res = $mysqli->query($query);
        if($res === false) {
            return [];
        }

        $top = [];
        while($row = $res->fetch_assoc()) {
            $top[] = [
                "name" => (string) $row["name"],
                "value" => (int) $row["value"]
            ];
        }
        return $top;
    }

    private function resolveColumn(string $variable, string $mode): string {
        $variable = strtolower($variable) === "kills" ? "kills" : "wins";
        return $variable . "_" . $mode;
    }

    private function normalizeMode(string $mode): string {
        return match(strtolower($mode)) {
            "solo", "solos" => "solo",
            "duo", "duos" => "duo",
            default => "squad"
        };
    }
}
