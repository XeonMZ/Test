<?php

declare(strict_types=1);

namespace aeroDEV\bedwars\leaderboard;

use pocketmine\player\Player;
use pocketmine\utils\Config;
use pocketmine\world\particle\FloatingTextParticle;
use pocketmine\world\Position;
use function strtoupper;

class FloatingLeaderboardManager {

    private Config $boards_config;
    /** @var array<int, FloatingTextParticle> */
    private array $rendered_particles = [];

    public function __construct(
        private LeaderboardStorageContract $storage,
        string $data_folder
    ) {
        $this->boards_config = new Config($data_folder . "leaderboards.yml", Config::YAML, [
            "boards" => []
        ]);
    }

    public function setBoard(Position $position, string $variable, string $mode): void {
        $boards = $this->boards_config->get("boards", []);
        $boards[] = [
            "variable" => $variable,
            "mode" => $mode,
            "world" => $position->getWorld()->getFolderName(),
            "x" => $position->getX(),
            "y" => $position->getY(),
            "z" => $position->getZ()
        ];
        $this->boards_config->set("boards", $boards);
        $this->boards_config->save();
    }

    public function updateBoards(): void {
        foreach($this->boards_config->get("boards", []) as $index => $board) {
            $world = \pocketmine\Server::getInstance()->getWorldManager()->getWorldByName((string) $board["world"]);
            if($world === null) {
                continue;
            }

            $variable = (string) $board["variable"];
            $mode = (string) $board["mode"];
            $pos = new Position((float) $board["x"], (float) $board["y"], (float) $board["z"], $world);

            $top = $this->storage->getTop($variable, $mode, 10);
            $lines = [];
            $rank = 1;
            foreach($top as $entry) {
                $lines[] = "§f{$rank}.{$entry["name"]} §e{$entry["value"]}";
                $rank++;
            }
            if($lines === []) {
                $lines[] = "§7No data yet";
            }

            $title = "§l§eTOP 10 " . strtoupper($variable) . " " . strtoupper($mode);
            $text = implode("\n", $lines);

            // Remove old floating text instance first to avoid stacking duplicates.
            if(isset($this->rendered_particles[$index])) {
                $old = $this->rendered_particles[$index];
                $old->setInvisible();
                $world->addParticle($pos, $old);
            }

            $particle = new FloatingTextParticle($text, $title);
            $world->addParticle($pos, $particle);
            $this->rendered_particles[$index] = $particle;
        }
    }

    public static function normalizeVariable(string $input): ?string {
        $input = strtolower($input);
        return match($input) {
            "wins", "win" => "wins",
            "kills", "kill" => "kills",
            default => null
        };
    }

    public static function normalizeMode(string $input): ?string {
        $input = strtolower($input);
        return match($input) {
            "solos", "solo" => "solos",
            "duos", "duo" => "duos",
            "total", "all" => "total",
            "squad", "squads" => "squad",
            default => null
        };
    }

    public function setBoardFromPlayer(Player $player, string $variable, string $mode): void {
        $this->setBoard($player->getPosition(), $variable, $mode);
        $this->updateBoards();
    }
}
