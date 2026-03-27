<?php

declare(strict_types=1);


namespace aeroDEV\bedwars\game\shop\tracker;


use aeroDEV\bedwars\game\shop\Category;
use aeroDEV\bedwars\game\team\Team;
use aeroDEV\bedwars\session\Session;
use function array_map;

class TrackerCategory extends Category {

    public function __construct() {
        parent::__construct("Tracker Shop");
    }

    /**
     * @return TrackerProduct[]
     */
    public function getProducts(Session $session): array {
        return array_map(function(Team $team) {
            return new TrackerProduct($name = $team->getName(), "Track Team " . $name);
        }, $session->getGame()->getTeams());
    }

}