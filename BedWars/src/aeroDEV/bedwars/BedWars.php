<?php

declare(strict_types=1);


namespace aeroDEV\bedwars;


use bStats\PocketmineMp\Metrics;
use pocketmine\entity\Entity;
use pocketmine\entity\EntityDataHelper;
use pocketmine\entity\EntityFactory;
use pocketmine\entity\Human;
use pocketmine\event\Listener;
use pocketmine\nbt\tag\CompoundTag;
use pocketmine\plugin\PluginBase;
use pocketmine\utils\SingletonTrait;
use pocketmine\world\World;
use aeroDEV\bedwars\command\BedWarsCommand;
use aeroDEV\bedwars\entity\PlayBedwarsEntity;
use aeroDEV\bedwars\game\entity\misc\Fireball;
use aeroDEV\bedwars\game\entity\shop\ItemShopVillager;
use aeroDEV\bedwars\game\entity\shop\UpgradesShopVillager;
use aeroDEV\bedwars\game\GameHeartbeat;
use aeroDEV\bedwars\game\GameManager;
use aeroDEV\bedwars\game\map\MapFactory;
use aeroDEV\bedwars\game\task\RemoveGameTask;
use aeroDEV\bedwars\listener\GameListener;
use aeroDEV\bedwars\listener\ItemListener;
use aeroDEV\bedwars\listener\SessionListener;
use aeroDEV\bedwars\listener\SetupListener;
use aeroDEV\bedwars\listener\SpawnProtectionListener;
use aeroDEV\bedwars\listener\WaitingListener;
use aeroDEV\bedwars\provider\json\JsonProvider;
use aeroDEV\bedwars\provider\mysql\MysqlProvider;
use aeroDEV\bedwars\provider\Provider;
use aeroDEV\bedwars\provider\sqlite\SqliteProvider;
use aeroDEV\bedwars\session\SessionFactory;
use aeroDEV\bedwars\utils\ConfigGetter;
use function preg_replace;
use function strtolower;

class BedWars extends PluginBase {
    use SingletonTrait;

    private Provider $provider;
    private Metrics $metrics;
    private GameManager $game_manager;

    protected function onLoad(): void {
        self::setInstance($this);

        $worlds_dir = $this->getDataFolder() . "worlds/";
        if(!is_dir($worlds_dir)) {
            mkdir($worlds_dir);
        }

        $this->saveResource("maps.json");
    }

    protected function onEnable(): void {
        MapFactory::init();

        $this->provider = $this->obtainProvider();
        $this->metrics = new Metrics($this, 29605);
        $this->game_manager = new GameManager();

        $this->registerEntity(PlayBedwarsEntity::class);
        $this->registerEntity(ItemShopVillager::class);
        $this->registerEntity(UpgradesShopVillager::class);
        $this->registerFireball();

        $this->registerListener(new GameListener());
        $this->registerListener(new ItemListener());
        $this->registerListener(new SessionListener());
        $this->registerListener(new SetupListener());
        $this->registerListener(new WaitingListener());

        if(ConfigGetter::isSpawnProtectionEnabled()) {
            $this->registerListener(new SpawnProtectionListener());
        }

        $this->getServer()->getCommandMap()->register("bedwars", new BedWarsCommand());

        $this->getScheduler()->scheduleRepeatingTask(new GameHeartbeat(), 1);
    }

    protected function onDisable(): void {
        foreach(SessionFactory::getSessions() as $session) {
            $session->save();
        }

        foreach($this->game_manager->getGames() as $game) {
            $game->unloadWorld();
            $this->getServer()->getAsyncPool()->submitTask(new RemoveGameTask($game));
        }
    }

    private function registerListener(Listener $listener): void {
        $this->getServer()->getPluginManager()->registerEvents($listener, $this);
    }

    private function registerEntity(string $class): void {
        $identifier = "bedwars:" . $this->normalizeEntityIdentifier($class);

        EntityFactory::getInstance()->register($class, function(World $world, CompoundTag $nbt) use ($class): Entity {
            return new $class(EntityDataHelper::parseLocation($nbt, $world), Human::parseSkinNBT($nbt), $nbt);
        }, [$identifier]);
    }

    private function normalizeEntityIdentifier(string $class): string {
        return strtolower((string) preg_replace('/[^a-z0-9_]+/i', '_', $class));
    }

    private function registerFireball(): void {
        EntityFactory::getInstance()->register(Fireball::class, function(World $world, CompoundTag $nbt): Fireball {
            return new Fireball(EntityDataHelper::parseLocation($nbt, $world), null);
        }, ["bedwars:fireball"]);
    }

    private function obtainProvider(): Provider {
        return match(strtolower(ConfigGetter::getProvider())) {
            "mysql" => new MysqlProvider(),
            "sqlite", "sqlite3" => new SqliteProvider(),
            "json" => new JsonProvider(),
            default => throw new \Error("Invalid provider, check your config and try again.")
        };
    }

    public function getProvider(): Provider {
        return $this->provider;
    }

    public function getMetrics(): Metrics {
        return $this->metrics;
    }

    public function getGameManager(): GameManager {
        return $this->game_manager;
    }

}