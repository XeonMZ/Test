<?php

declare(strict_types=1);


namespace aeroDEV\bedwars\game\team\upgrade;


use aeroDEV\bedwars\game\team\Team;
use aeroDEV\bedwars\session\Session;

abstract class Upgrade {

    protected int $level = 0;

    public function getLevel(): int {
        return $this->level;
    }

    public function canLevelUp(): bool {
        return $this->level < $this->getLevels();
    }

    public function levelUp(Team $team): void {
        $this->level++;

        $this->internalLevelUp($team);
        foreach($team->getMembers() as $session) {
            $this->applySession($session);
        }
    }

    public function applySession(Session $session): void {
        if($this->level > 0) {
            $this->internalApplySession($session);
        }
    }

    protected function internalLevelUp(Team $team): void {}

    protected function internalApplySession(Session $session): void {}

    abstract public function getName(): string;

    abstract public function getLevels(): int;

}