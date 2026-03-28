<?php

declare(strict_types=1);

namespace aeroDEV\bedwars\leaderboard\storage;

use aeroDEV\bedwars\leaderboard\LeaderboardStorage;
use aeroDEV\bedwars\provider\mysql\MysqlCredentials;

class MysqlLeaderboardStorage implements LeaderboardStorage {

    public function __construct(private MysqlCredentials $credentials) {}

    public function getTop(string $variable, string $mode, int $limit = 10): array {
        $column = $variable === "kills" ? "kills" : "wins";
        $mysqli = $this->credentials->getMysqli();
        if($mysqli->connect_error) {
            return [];
        }

        $name_column = "xuid";
        if($columns_res = $mysqli->query("SHOW COLUMNS FROM bedwars_users")) {
            while($col = $columns_res->fetch_assoc()) {
                $field = strtolower((string) ($col["Field"] ?? ""));
                if($field === "username" || $field === "name") {
                    $name_column = $field;
                    break;
                }
            }
        }

        $limit = max(1, $limit);
        $query = "SELECT {$name_column} AS player_name, {$column} AS value FROM bedwars_users ORDER BY {$column} DESC LIMIT {$limit}";
        $res = $mysqli->query($query);
        if($res === false) {
            return [];
        }

        $top = [];
        while($row = $res->fetch_assoc()) {
            $top[] = [
                "name" => (string) $row["player_name"],
                "value" => (int) $row["value"]
            ];
        }
        return $top;
    }
}
