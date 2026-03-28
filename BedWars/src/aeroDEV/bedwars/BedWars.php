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
use aeroDEV\bedwars\game\entity\misc\BridgeEgg;
use aeroDEV\bedwars\game\entity\misc\Fireball;
use aeroDEV\bedwars\game\entity\shop\ItemShopVillager;
use aeroDEV\bedwars\game\entity\shop\UpgradesShopVillager;
use aeroDEV\bedwars\game\shop\quickbuy\QuickBuyStorage;
use aeroDEV\bedwars\game\shop\quickbuy\storage\JsonQuickBuyStorage;
use aeroDEV\bedwars\game\shop\quickbuy\storage\MysqlQuickBuyStorage;
use aeroDEV\bedwars\game\shop\quickbuy\storage\YamlQuickBuyStorage;
use aeroDEV\bedwars\game\GameHeartbeat;
use aeroDEV\bedwars\game\GameManager;
use aeroDEV\bedwars\game\map\MapFactory;
use aeroDEV\bedwars\game\task\RemoveGameTask;
use aeroDEV\bedwars\leaderboard\FloatingLeaderboardManager;
use aeroDEV\bedwars\leaderboard\LeaderboardStorage;
use aeroDEV\bedwars\leaderboard\storage\JsonLeaderboardStorage;
use aeroDEV\bedwars\leaderboard\storage\MysqlLeaderboardStorage;
use aeroDEV\bedwars\leaderboard\storage\YamlLeaderboardStorage;
use aeroDEV\bedwars\listener\GameListener;
use aeroDEV\bedwars\listener\ItemListener;
use aeroDEV\bedwars\listener\SessionListener;
use aeroDEV\bedwars\listener\SetupListener;
use aeroDEV\bedwars\listener\SpawnProtectionListener;
use aeroDEV\bedwars\listener\WaitingListener;
use aeroDEV\bedwars\provider\json\JsonProvider;
use aeroDEV\bedwars\provider\mysql\MysqlCredentials;
use aeroDEV\bedwars\provider\mysql\MysqlProvider;
use aeroDEV\bedwars\provider\Provider;
use aeroDEV\bedwars\provider\sqlite\SqliteProvider;
use aeroDEV\bedwars\session\SessionFactory;
use aeroDEV\bedwars\game\shop\Shop;
use aeroDEV\bedwars\utils\ConfigGetter;
use muqsit\invmenu\InvMenuHandler;
use function preg_replace;
use function strtolower;

class BedWars extends PluginBase {
    use SingletonTrait;

    private Provider $provider;
    private Metrics $metrics;
    private GameManager $game_manager;
    private Shop $shop;
    private QuickBuyStorage $quick_buy_storage;
    private LeaderboardStorage $leaderboard_storage;
    private FloatingLeaderboardManager $floating_leaderboard_manager;

    protected function onLoad(): void {
        self::setInstance($this);

        $worlds_dir = $this->getDataFolder() . "worlds/";
        if(!is_dir($worlds_dir)) {
            mkdir($worlds_dir);
        }

        $this->saveResource("maps.json");
 }

    public function onEnable(): void {
    InvMenuHandler::register($this);    MapFactory::init();
        $this->provider = $this->obtainProvider();
        $this->quick_buy_storage = $this->obtainQuickBuyStorage();
        $this->leaderboard_storage = $this->obtainLeaderboardStorage();
        $this->floating_leaderboard_manager = new FloatingLeaderboardManager($this->leaderboard_storage, $this->getDataFolder());
        $this->metrics = new Metrics($this, 29605);
        $this->game_manager = new GameManager();

        $this->registerEntity(PlayBedwarsEntity::class);
        $this->registerEntity(ItemShopVillager::class);
        $this->registerEntity(UpgradesShopVillager::class);
        $this->registerFireball();
        $this->registerBridgeEgg();

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
        $this->getScheduler()->scheduleRepeatingTask(new \pocketmine\scheduler\ClosureTask(function(): void {
            $this->floating_leaderboard_manager->updateBoards();
        }), 20 * 60 * 60 * 24); // 24 jam
        $this->floating_leaderboard_manager->updateBoards();
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

    private function registerBridgeEgg(): void {
        EntityFactory::getInstance()->register(BridgeEgg::class, function(World $world, CompoundTag $nbt): BridgeEgg {
            return new BridgeEgg(EntityDataHelper::parseLocation($nbt, $world), null);
        }, ["bedwars:bridge_egg"]);
    }

    private function obtainQuickBuyStorage(): QuickBuyStorage {
        return match(strtolower(ConfigGetter::getQuickBuyStorage())) {
            "mysql" => new MysqlQuickBuyStorage(MysqlCredentials::fromData(ConfigGetter::getMysqlCredentials())),
            "json" => new JsonQuickBuyStorage(),
            default => new YamlQuickBuyStorage()
        };
    }

    private function obtainProvider(): Provider {
        return match(strtolower(ConfigGetter::getProvider())) {
            "mysql" => new MysqlProvider(),
            "sqlite", "sqlite3" => new SqliteProvider(),
            "json" => new JsonProvider(),
            default => throw new \Error("Invalid provider, check your config and try again.")
        };
    }

    private function obtainLeaderboardStorage(): LeaderboardStorage {
        return match(strtolower(ConfigGetter::getLeaderboardStorage())) {
            "mysql" => new MysqlLeaderboardStorage(MysqlCredentials::fromData(ConfigGetter::getMysqlCredentials())),
            "json" => new JsonLeaderboardStorage(),
            default => new YamlLeaderboardStorage()
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

public function getQuickBuyStorage(): QuickBuyStorage {
    return $this->quick_buy_storage;
    }
    

public function getShopManager(): Shop{

    return $this->shop;

}

public function getFloatingLeaderboardManager(): FloatingLeaderboardManager {
    return $this->floating_leaderboard_manager;
}
}
