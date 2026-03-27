<?php

declare(strict_types=1);


namespace aeroDEV\bedwars\item\spectator;


use aeroDEV\bedwars\item\BedwarsItem;
use aeroDEV\bedwars\session\Session;

abstract class SpectatorItem extends BedwarsItem {

    public function onInteract(Session $session): void {
        if($session->isSpectator()) {
            $this->onSpectatorInteract($session);
        }
    }

    abstract protected function onSpectatorInteract(Session $session): void;

}