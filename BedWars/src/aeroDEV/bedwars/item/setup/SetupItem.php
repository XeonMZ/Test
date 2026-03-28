<?php

declare(strict_types=1);


namespace aeroDEV\bedwars\item\setup;


use pocketmine\item\Item;
use aeroDEV\bedwars\item\BedwarsItem;

abstract class SetupItem extends BedwarsItem {

    public function asItem(): Item {
        $item = parent::asItem();
        $item->getNamedTag()->setByte("setup", 1);
        return $item;
    }

}