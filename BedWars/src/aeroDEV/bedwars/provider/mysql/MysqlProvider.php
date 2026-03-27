<?php

declare(strict_types=1);


namespace aeroDEV\bedwars\provider\mysql;


use pocketmine\Server;
use aeroDEV\bedwars\provider\mysql\task\CreateTablesTask;
use aeroDEV\bedwars\provider\mysql\task\LoadSessionTask;
use aeroDEV\bedwars\provider\mysql\task\UpdateCoinsTask;
use aeroDEV\bedwars\provider\mysql\task\UpdateKillsTask;
use aeroDEV\bedwars\provider\mysql\task\UpdateWinsTask;
use aeroDEV\bedwars\provider\Provider;
use aeroDEV\bedwars\session\Session;
use aeroDEV\bedwars\utils\ConfigGetter;

class MysqlProvider extends Provider {

    private MysqlCredentials $credentials;

    public function __construct() {
        $this->credentials = MysqlCredentials::fromData(ConfigGetter::getMysqlCredentials());

        $this->scheduleAsyncTask(new CreateTablesTask($this->credentials));
    }

    public function getCredentials(): MysqlCredentials {
        return $this->credentials;
    }

    public function loadSession(Session $session): void {
        $this->scheduleAsyncTask(new LoadSessionTask($session));
    }

    public function updateCoins(Session $session): void {
        $this->scheduleAsyncTask(new UpdateCoinsTask($session));
    }

    public function updateKills(Session $session): void {
        $this->scheduleAsyncTask(new UpdateKillsTask($session));
    }

    public function updateWins(Session $session): void {
        $this->scheduleAsyncTask(new UpdateWinsTask($session));
    }

    public function saveSession(Session $session): void {}

    private function scheduleAsyncTask(MysqlAsyncTask $task): void {
        Server::getInstance()->getAsyncPool()->submitTask($task);
    }

}