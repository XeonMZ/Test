<?php

declare(strict_types=1);

namespace aeroDEV\bedwars\leaderboard\storage;

use aeroDEV\bedwars\BedWars;
use aeroDEV\bedwars\leaderboard\LeaderboardStorage;
use pocketmine\utils\Config;
use function array_slice;
use function arsort;
use function glob;
use function is_array;
use function pathinfo;
use const PATHINFO_FILENAME;

class YamlLeaderboardStorage implements LeaderboardStorage {

    public function getTop(string $variable, string $mode, int $limit = 10): array {
        $result = [];
        $users_dir = BedWars::getInstance()->getDataFolder() . "users/";

        foreach(glob($users_dir . "*.yml") as $file) {
            $config = new Config($file, Config::YAML);
            $stats_by_mode = $config->get("leaderboard", []);

            $value = 0;
            if(is_array($stats_by_mode) && isset($stats_by_mode[strtolower($mode)][$variable])) {
                $value = (int) $stats_by_mode[strtolower($mode)][$variable];
            } else {
                $value = (int) $config->get($variable, 0);
            }

            $name = (string) pathinfo($file, PATHINFO_FILENAME);
            $result[$name] = $value;
        }

        arsort($result);
        $top = [];
        foreach(array_slice($result, 0, $limit, true) as $name => $value) {
            $top[] = ["name" => (string) $name, "value" => (int) $value];
        }
        return $top;
    }
}
