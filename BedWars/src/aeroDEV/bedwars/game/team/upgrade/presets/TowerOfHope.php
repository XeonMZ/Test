<?php

declare(strict_types=1);

namespace aeroDEV\bedwars\game\team\upgrade\presets;

use aeroDEV\bedwars\game\team\upgrade\Upgrade;

class TowerOfHope extends Upgrade {

    public function getName(): string {
        return "Tower Of Hope";
    }

    public function getLevels(): int {
        return 2; // tier 0 wool, tier 1 clay, tier 2 end stone (max)
    }
}
