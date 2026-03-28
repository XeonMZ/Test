<?php

declare(strict_types=1);

namespace aeroDEV\bedwars\game\shop\quickbuy\storage;

use aeroDEV\bedwars\game\shop\quickbuy\QuickBuyStorage;
use aeroDEV\bedwars\provider\mysql\MysqlCredentials;
use mysqli;

final class MysqlQuickBuyStorage implements QuickBuyStorage {

    public function __construct(private MysqlCredentials $credentials) {
        $mysqli = $this->createConnection();
        $mysqli->query("CREATE TABLE IF NOT EXISTS bedwars_quickbuy (xuid VARCHAR(32) PRIMARY KEY, layout TEXT NOT NULL)");
        $mysqli->close();
    }

    public function load(string $xuid): ?array {
        $mysqli = $this->createConnection();

        $stmt = $mysqli->prepare("SELECT layout FROM bedwars_quickbuy WHERE xuid = ? LIMIT 1");
        $stmt->bind_param("s", $xuid);
        $stmt->execute();
        $stmt->bind_result($layout);
        $hasRow = $stmt->fetch();
        $stmt->close();
        $mysqli->close();

        if(!$hasRow || $layout === null) {
            return null;
        }

        $decoded = json_decode($layout, true);
        return is_array($decoded) ? $decoded : null;
    }

    public function save(string $xuid, array $layout): void {
        $mysqli = $this->createConnection();
        $encoded = json_encode(array_values($layout), JSON_THROW_ON_ERROR);

        $stmt = $mysqli->prepare("INSERT INTO bedwars_quickbuy (xuid, layout) VALUES (?, ?) ON DUPLICATE KEY UPDATE layout = VALUES(layout)");
        $stmt->bind_param("ss", $xuid, $encoded);
        $stmt->execute();
        $stmt->close();
        $mysqli->close();
    }

    private function createConnection(): mysqli {
        return new mysqli(
            $this->credentials->getHostname(),
            $this->credentials->getUsername(),
            $this->credentials->getPassword(),
            $this->credentials->getDatabase(),
            $this->credentials->getPort()
        );
    }
}
