<?php

declare(strict_types=1);


namespace aeroDEV\bedwars\utils;


use aeroDEV\bedwars\BedWars;

class ConfigGetter {

    static private function get(string $key, mixed $default = false): mixed {
        return BedWars::getInstance()->getConfig()->get($key, $default);
    }

    static public function getVersion(): int|float {
        return self::get("version", 1.0);
    }

    static public function getIP(): string {
        return self::get("ip", "play.server.net");
    }

    static public function isSpawnProtectionEnabled(): bool {
        return self::get("spawn-protection", true);
    }

    static public function getProvider(): string {
        return self::get("provider", "sqlite");
    }

    static public function getMysqlCredentials(): array {
        return self::get("mysql-credentials", []);
    }

    static public function getQuickBuyStorage(): string {
        // Support new key quickbuy.provider while keeping backward compatibility.
        return self::get("quickbuy.provider", self::get("quickbuy-storage", "yaml"));
    }

    static public function isQuickBuyEnabled(): bool {
        return self::get("quickbuy.enabled", true);
    }

    /**
     * @return string[]
     */
    static public function getQuickBuyDefaultLayout(): array {
        $layout = self::get("quickbuy.default-layout", []);
        return is_array($layout) ? array_values($layout) : [];
    }

    static public function getLeaderboardStorage(): string {
        return self::get("leaderboard-storage", "yaml");
    }

}
