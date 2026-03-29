<?php

declare(strict_types=1);

namespace aeroDEV\bedwars\provider\mysql\task;

use aeroDEV\bedwars\provider\mysql\MysqlAsyncTask;
use mysqli;

class CreateTablesTask extends MysqlAsyncTask {

    protected function onConnection(mysqli $mysqli): void {
        $mysqli->query(
            "CREATE TABLE IF NOT EXISTS bedwars_users (
                xuid VARCHAR(16) PRIMARY KEY,
                username VARCHAR(32) DEFAULT '',
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
            )"
        );

        $mysqli->query("ALTER TABLE bedwars_users ADD COLUMN username VARCHAR(32) DEFAULT ''");
        $mysqli->query("ALTER TABLE bedwars_users ADD COLUMN kills_solo INT DEFAULT 0");
        $mysqli->query("ALTER TABLE bedwars_users ADD COLUMN kills_duo INT DEFAULT 0");
        $mysqli->query("ALTER TABLE bedwars_users ADD COLUMN kills_squad INT DEFAULT 0");
        $mysqli->query("ALTER TABLE bedwars_users ADD COLUMN wins_solo INT DEFAULT 0");
        $mysqli->query("ALTER TABLE bedwars_users ADD COLUMN wins_duo INT DEFAULT 0");
        $mysqli->query("ALTER TABLE bedwars_users ADD COLUMN wins_squad INT DEFAULT 0");
    }
}
