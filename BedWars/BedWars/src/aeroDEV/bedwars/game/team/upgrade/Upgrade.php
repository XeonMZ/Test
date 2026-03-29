<?php

declare(strict_types=1);

namespace aeroDEV\bedwars\game\team\upgrade;

use aeroDEV\bedwars\game\team\Team;
use aeroDEV\bedwars\session\Session;

abstract class Upgrade {

    protected int $level = 0;

    abstract public function getName(): string;

    abstract public function getLevels(): int;

    public function applySession(Session $session): void {
        // Upgrade effects must only apply after at least one purchase/level-up.
        if($this->level <= 0) {
            return;
        }

        $this->internalApplySession($session);
    }

    /**
     * Some upgrades don't apply direct session effects.
     * Keep a safe no-op default so those upgrades stay instantiable.
     */
    protected function internalApplySession(Session $session): void {
        // no-op by default
    }

    /**
     * Called when the upgrade level is increased.
     * Team-scoped upgrades can override this to update generators/traps/etc.
     */
    protected function internalLevelUp(Team $team): void {
        // no-op by default
    }

    public function getLevel(): int {
        return $this->level;
    }

    // Backward-compatible alias used across shop/stage code.
    public function canLevelUp(): bool {
        return $this->canBeUpgraded();
    }

    public function canBeUpgraded(): bool {
        return $this->level < $this->getLevels();
    }

    // Backward-compatible API expected by upgrade shop.
    public function levelUp(Team $team): bool {
        if(!$this->canLevelUp()) {
            return false;
        }

        ++$this->level;
        $this->internalLevelUp($team);

        // Sync upgrade effects to all current team members in real-time.
        if(method_exists($team, "getMembers")) {
            foreach($team->getMembers() as $member) {
                if($member instanceof Session) {
                    $this->applySession($member);
                }
            }
        }

        return true;
    }

    public function upgrade(): bool {
        if(!$this->canBeUpgraded()) {
            return false;
        }

        ++$this->level;
        return true;
    }
}
