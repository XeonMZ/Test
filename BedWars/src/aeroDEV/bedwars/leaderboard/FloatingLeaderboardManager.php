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

    public function __construct(
        private LeaderboardStorage $storage,
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
        foreach($this->boards_config->get("boards", []) as $board) {
            $world = \pocketmine\Server::getInstance()->getWorldManager()->getWorldByName((string) $board["world"]);
            if($world === null) {
                continue;
            }

            $variable = (string) $board["variable"];
            $mode = (string) $board["mode"];
            $pos = new Position((float) $board["x"], (float) $board["y"], (float) $board["z"], $world);

            $top = $this->storage->getTop($variable, $mode, 10);
            $lines = [];
            $index = 1;
            foreach($top as $entry) {
                $lines[] = "§e#{$index} §f{$entry["name"]} §7- §a{$entry["value"]}";
                $index++;
            }
            if($lines === []) {
                $lines[] = "§7No data yet";
            }

            $title = "§l§bBEDWARS §fTOP 10 " . strtoupper($variable) . " §7(" . strtoupper($mode) . ")";
            $text = implode("\n", $lines);
            $world->addParticle($pos, new FloatingTextParticle($text, $title));
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
            "squad", "squads" => "squad",
            default => null
        };
    }

    public function setBoardFromPlayer(Player $player, string $variable, string $mode): void {
        $this->setBoard($player->getPosition(), $variable, $mode);
        $this->updateBoards();
    }
}
