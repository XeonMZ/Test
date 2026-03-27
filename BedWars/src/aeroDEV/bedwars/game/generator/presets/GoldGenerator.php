<?php

declare(strict_types=1);


namespace aeroDEV\bedwars\game\generator\presets;


use pocketmine\item\Item;
use pocketmine\item\VanillaItems;
use aeroDEV\bedwars\game\generator\Generator;
use aeroDEV\bedwars\game\generator\GeneratorType;

class GoldGenerator extends Generator {

    public function getType(): GeneratorType {
        return GeneratorType::GOLD;
    }

    public function getInitialSpeed(): int {
        return 5;
    }

    protected function getItem(): Item {
        return VanillaItems::GOLD_INGOT();
    }

}