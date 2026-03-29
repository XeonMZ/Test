<?php

declare(strict_types=1);

namespace aeroDEV\bedwars\leaderboard\storage;

use aeroDEV\bedwars\BedWars;
use aeroDEV\bedwars\leaderboard\LeaderboardStorageContract;
use pocketmine\utils\Config;
use function array_slice;
use function arsort;
use function glob;
use function is_array;
use function pathinfo;
use function trim;
use const PATHINFO_FILENAME;

class YamlLeaderboardStorage implements LeaderboardStorageContract {

    public function getTop(string $variable, string $mode, int $limit = 10): array {
        $result = [];
        $users_dir = BedWars::getInstance()->getDataFolder() . "users/";

        foreach(glob($users_dir . "*.yml") as $file) {
            $config = new Config($file, Config::YAML);
            $stats_by_mode = $config->get("leaderboard", []);

            $value = 0;
            $normalized_mode = $this->normalizeMode($mode);
            if(is_array($stats_by_mode) && isset($stats_by_mode[$normalized_mode][$variable])) {
                $value = (int) $stats_by_mode[$normalized_mode][$variable];
            } else {
                $value = (int) $config->get($variable, 0);
            }

            $fallback_name = (string) pathinfo($file, PATHINFO_FILENAME);
            $display_name = trim((string) $config->get("username", $fallback_name));
            $result[$display_name !== "" ? $display_name : $fallback_name] = $value;
        }

        arsort($result);
        $top = [];
        foreach(array_slice($result, 0, $limit, true) as $name => $value) {
            $top[] = ["name" => (string) $name, "value" => (int) $value];
        }
        return $top;
    }

    private function normalizeMode(string $mode): string {
        return match(strtolower($mode)) {
            "solo", "solos" => "solo",
            "duo", "duos" => "duo",
            default => "squad"
        };
    }
}
