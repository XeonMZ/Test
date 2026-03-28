<?php

declare(strict_types=1);

namespace aeroDEV\bedwars\game\team\upgrade\presets;

use aeroDEV\bedwars\game\team\upgrade\Upgrade;

class BridgeOfLife extends Upgrade {

    public function getName(): string {
        return "Bridge Of Life";
    }

    public function getLevels(): int {
        return 1; // tier 0 wool, tier 1 hardened clay (max)
    }
}
