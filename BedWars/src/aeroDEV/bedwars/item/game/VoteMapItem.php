<?php

declare(strict_types=1);

namespace aeroDEV\bedwars\item\game;

use pocketmine\item\Item;
use pocketmine\item\VanillaItems;
use aeroDEV\bedwars\form\queue\VoteMapForm;
use aeroDEV\bedwars\item\BedwarsItem;
use aeroDEV\bedwars\session\Session;

class VoteMapItem extends BedwarsItem {

    public function __construct() {
        parent::__construct("Vote Map");
    }

    public function onInteract(Session $session): void {
        if(!$session->hasGame()) {
            return;
        }
        $session->getPlayer()->sendForm(new VoteMapForm($session));
    }

    protected function realItem(): Item {
        return VanillaItems::PAPER();
    }
}
