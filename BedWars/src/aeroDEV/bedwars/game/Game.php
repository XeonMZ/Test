<?php

declare(strict_types=1);


namespace aeroDEV\bedwars\game;


use pocketmine\entity\Location;
use pocketmine\Server;
use pocketmine\utils\Utils;
use pocketmine\world\format\Chunk;
use pocketmine\world\Position;
use pocketmine\world\sound\Sound;
use pocketmine\world\World;
use pocketmine\world\WorldException;
use aeroDEV\bedwars\BedWars;
use aeroDEV\bedwars\entity\PlayBedwarsEntity;
use aeroDEV\bedwars\game\entity\shop\ItemShopVillager;
use aeroDEV\bedwars\game\entity\shop\UpgradesShopVillager;
use aeroDEV\bedwars\game\entity\shop\Villager;
use aeroDEV\bedwars\game\generator\Generator;
use aeroDEV\bedwars\game\generator\presets\TextGenerator;
use aeroDEV\bedwars\game\map\Map;
use aeroDEV\bedwars\game\stage\Stage;
use aeroDEV\bedwars\game\stage\WaitingStage;
use aeroDEV\bedwars\game\task\RemoveGameTask;
use aeroDEV\bedwars\game\team\Team;
use aeroDEV\bedwars\session\Session;
use function array_merge;
use function array_search;
use function count;
use function in_array;
use function is_string;
use function array_count_values;
use function array_rand;

class Game {

    private int $id;

    private Map $map;
    private Stage $stage;

    private ?World $world = null;

    /** @var Generator[] */
    private array $generators;

    /** @var Team[] */
    private array $teams;

    /** @var Position[] */
    private array $blocks = [];

    /** @var Session[] */
    private array $players = [];

    /** @var Session[] */
    private array $spectators = [];

    /** @var array<string,string> */
    private array $map_votes = [];

    private bool $map_vote_locked = false;

    private int $fake_spectator_count = 0;

    public function __construct(Map $map, int $id) {
        $this->id = $id;
        $this->map = $map;
        $this->teams = Utils::cloneObjectArray($map->getTeams());
        $this->generators = Utils::cloneObjectArray($map->getGenerators());

        $this->setStage(new WaitingStage());
    }

    public function getId(): int {
        return $this->id;
    }

    public function getStage(): Stage {
        return $this->stage;
    }

    public function getMap(): Map {
        return $this->map;
    }

    public function voteMap(Session $session, Map $map): bool {
        if($this->map_vote_locked || $map->getPlayersPerTeam() !== $this->map->getPlayersPerTeam()) {
            return false;
        }
        $this->map_votes[$session->getUsername()] = $map->getId();
        return true;
    }

    public function getMapVotesSummary(): array {
        $summary = [];
        foreach(array_count_values($this->map_votes) as $mapId => $votes) {
            $map = \aeroDEV\bedwars\game\map\MapFactory::getMapById($mapId);
            if($map !== null) {
                $summary[$map->getName()] = $votes;
            }
        }
        return $summary;
    }

    public function lockVotedMap(): void {
        if($this->map_vote_locked) {
            return;
        }
        $this->map_vote_locked = true;

        $maps = \aeroDEV\bedwars\game\map\MapFactory::getMapsByPlayers($this->map->getPlayersPerTeam());
        if($maps === []) {
            return;
        }

        if($this->map_votes === []) {
            $this->setMap($maps[array_rand($maps)]);
            return;
        }

        $voteCounts = array_count_values($this->map_votes);
        $max = max($voteCounts);
        $leaders = [];
        foreach($voteCounts as $mapId => $votes) {
            if($votes === $max) {
                $leaders[] = $mapId;
            }
        }

        $chosenId = $leaders[array_rand($leaders)];
        $chosenMap = \aeroDEV\bedwars\game\map\MapFactory::getMapById($chosenId);
        if($chosenMap !== null) {
            $this->setMap($chosenMap);
        }
    }

    public function setMap(Map $map): void {
        $this->map = $map;
        $this->teams = Utils::cloneObjectArray($map->getTeams());
        $this->generators = Utils::cloneObjectArray($map->getGenerators());
        foreach($this->players as $session) {
            $session->setTeam(null);
        }
        $this->updateScoreboards();
    }

    public function getWorld(): ?World {
        return $this->world;
    }

    /**
     * @return Generator[]
     */
    public function getGenerators(): array {
        return $this->generators;
    }

    /**
     * @return Team[]
     */
    public function getTeams(): array {
        return $this->teams;
    }

    /**
     * @return Team[]
     */
    public function getAliveTeams(): array {
        $teams = [];
        foreach($this->teams as $team) {
            if($team->isAlive()) {
                $teams[] = $team;
            }
        }
        return $teams;
    }

    /**
     * @return Session[]
     */
    public function getPlayers(): array {
        return $this->players;
    }

    /**
     * @return Session[]
     */
    public function getSpectators(): array {
        return $this->spectators;
    }

    /**
     * @return Session[]
     */
    public function getPlayersAndSpectators(): array {
        return array_merge($this->players, $this->spectators);
    }

    public function getPlayersCount(): int {
        return count($this->players);
    }

    public function isFull(): bool {
        return $this->getPlayersCount() >= $this->map->getMaxCapacity();
    }

    public function getEffectivePlayersForStart(): int {
        return $this->getPlayersCount() + $this->fake_spectator_count;
    }

    public function addFakeSpectatorsForForceStart(): int {
        $required = (int) ceil($this->map->getMaxCapacity() / 2);
        $toAdd = max(0, $required - $this->getPlayersCount());
        $this->fake_spectator_count += $toAdd;
        return $toAdd;
    }

    public function clearFakeSpectators(): void {
        $this->fake_spectator_count = 0;
    }

    public function checkBlock(Position $position): bool {
        foreach($this->blocks as $index => $block) {
            if($block->equals($position)) {
                unset($this->blocks[$index]);
                return true;
            }
        }
        return false;
    }

    public function isPlaying(Session $session): bool {
        return in_array($session, $this->players, true);
    }

    public function isSpectator(Session $session): bool {
        return in_array($session, $this->spectators, true);
    }

    public function setStage(Stage $stage): void {
        $this->stage = $stage;
        if(!$stage instanceof \aeroDEV\bedwars\game\stage\WaitingStage) {
            $this->clearFakeSpectators();
        }
        $this->stage->start($this);
    }

    public function addBlock(Position $position): void {
        $this->blocks[] = $position;
    }

    public function addPlayer(Session $session): void {
        $this->players[] = $session;

        $this->stage->onJoin($session);

        $this->updateScoreboards();
        $this->updatePlayEntities();
    }

    public function removePlayer(Session $session, bool $teleport_to_hub = true, bool $set_spectator = false): void {
        unset($this->players[array_search($session, $this->players, true)]);
        unset($this->map_votes[$session->getUsername()]);

        $this->stage->onQuit($session);

        if($teleport_to_hub) {
            $session->teleportToHub();
        }

        if($set_spectator) {
            $this->addSpectator($session);
        } else {
            $session->setGame(null);
        }
        $this->updateScoreboards();
        $this->updatePlayEntities();
    }

    public function addSpectator(Session $session): void {
        $this->spectators[] = $session;

        $session->giveSpectatorItems();
        $session->getSpectatorSettings()->apply();
    }

    public function removeSpectator(Session $session): void {
        unset($this->spectators[array_search($session, $this->spectators, true)]);

        $this->despawnGeneratorsFrom($session);

        $session->setGame(null);
        $session->teleportToHub();
    }

    public function despawnGeneratorsFrom(Session $session): void {
        foreach($this->getGenerators() as $generator) {
            if($generator instanceof TextGenerator) {
                $generator->getText()->despawnFrom($session);
            }
        }
    }

    private function updatePlayEntities(): void {
        foreach(Server::getInstance()->getWorldManager()->getDefaultWorld()->getEntities() as $entity) {
            if($entity instanceof PlayBedwarsEntity and $entity->getPlayersPerTeam() === $this->map->getPlayersPerTeam()) {
                $entity->updateNameTag();
            }
        }
    }

    private function spawnVillager(Villager $villager): void {
        $position = $villager->getPosition()->floor();
        $this->world->requestChunkPopulation($position->getX() >> Chunk::COORD_BIT_SIZE, $position->getZ() >> Chunk::COORD_BIT_SIZE, null)->onCompletion(
            function() use ($villager) {
                $villager->spawnToAll();
            },
            function() {}
        );
    }

    public function tickGenerators(): void {
        foreach($this->generators as $generator) {
            $generator->tick($this);
        }
        foreach($this->teams as $team) {
            $team->tickGenerators($this);
        }
    }

    public function updateScoreboards(): void {
        foreach($this->getPlayersAndSpectators() as $session) {
            $session->updateScoreboard();
        }
    }

    public function broadcastTitle(string $title): void {
        foreach($this->players as $session) {
            $session->title($title);
        }
    }

    public function broadcastMessage(string $message): void {
        foreach($this->getPlayersAndSpectators() as $session) {
            $session->message($message);
        }
    }

    public function broadcastSound(Sound|string $sound): void {
        foreach($this->getPlayersAndSpectators() as $session) {
            if(is_string($sound)) {
                $session->playSound($sound);
            } else {
                $player = $session->getPlayer();
                $player->broadcastSound($sound, [$player]);
            }
        }
    }

    public function setupWorld(): void {
        $name = $this->map->getName() . "-" . $this->id;

        $world_manager = Server::getInstance()->getWorldManager();
        if(!$world_manager->loadWorld($name)) {
            throw new WorldException("Failed to load world");
        }

        $this->world = $world_manager->getWorldByName($name);
        $this->world->setAutoSave(false);
        $this->world->setTime(World::TIME_DAY);
        $this->world->stopTime();

        foreach($this->map->getShopPositions() as $position) {
            $this->spawnVillager(new ItemShopVillager(Location::fromObject($position, $this->world)));
        }
        foreach($this->map->getUpgradesPositions() as $position) {
            $this->spawnVillager(new UpgradesShopVillager(Location::fromObject($position, $this->world)));
        }
    }

    public function unloadWorld(): void {
        if($this->world !== null) {
            Server::getInstance()->getWorldManager()->unloadWorld($this->world);

            $this->world = null;
            $this->blocks = [];
        }
    }

    public function reset(): void {
        foreach($this->players as $session) {
            $this->removePlayer($session);
        }
        foreach($this->spectators as $spectator) {
            $this->removeSpectator($spectator);
        }
        foreach($this->generators as $generator) {
            $generator->reset();
        }

        $this->map_votes = [];
        $this->map_vote_locked = false;

        $this->unloadWorld();

        if(BedWars::getInstance()->getGameManager()->getGamesCount($this->map) > 5) {
            Server::getInstance()->getAsyncPool()->submitTask(new RemoveGameTask($this));
            return;
        }

        foreach($this->teams as $team) {
            $team->reset();
        }

        $this->setStage(new WaitingStage());
    }

}