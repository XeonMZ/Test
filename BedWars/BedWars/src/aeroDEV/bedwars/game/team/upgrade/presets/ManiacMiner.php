<?php

declare(strict_types=1);

namespace aeroDEV\bedwars\game\team\upgrade\presets;

use aeroDEV\bedwars\game\team\upgrade\Upgrade;
use aeroDEV\bedwars\session\Session;
use pocketmine\entity\effect\EffectInstance;
use pocketmine\entity\effect\VanillaEffects;

if(!class_exists(ManiacMiner::class, false)) {
    class ManiacMiner extends Upgrade {

        public function getName(): string {
            return "Maniac Miner";
        }

        public function getLevels(): int {
            return 2;
        }

        protected function internalApplySession(Session $session): void {
            $this->apply($session);
        }

        public function apply(Session $session): void {
            $amplifier = max(0, min(255, $this->level - 1));
            $session->getPlayer()->getEffects()->add(new EffectInstance(
                VanillaEffects::HASTE(),
                999999,
                $amplifier,
                false
            ));
        }
    }
}
