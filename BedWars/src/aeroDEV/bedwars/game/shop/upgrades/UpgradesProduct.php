<?php

declare(strict_types=1);


namespace aeroDEV\bedwars\game\shop\upgrades;


use pocketmine\item\VanillaItems;
use aeroDEV\bedwars\game\shop\Product;
use aeroDEV\bedwars\game\team\Team;
use aeroDEV\bedwars\session\Session;

abstract class UpgradesProduct extends Product {

    public function __construct(string $name, int $price) {
        parent::__construct($name, $name, $price, VanillaItems::DIAMOND());
    }

    public function onPurchase(Session $session): bool {
        if(!$session->hasTeam()) {
            return false;
        }
        $team = $session->getTeam();

        if(!$this->canBePurchased($session)) {
            $session->message("{RED}You already have this upgrade!");
            return false;
        }
        $this->purchase($team);
        return true;
    }

    abstract protected function purchase(Team $team): void;

}