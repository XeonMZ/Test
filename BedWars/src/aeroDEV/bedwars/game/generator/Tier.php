<?php

declare(strict_types=1);


namespace aeroDEV\bedwars\game\generator;


enum Tier {

    case I;
    case II;
    case III;

    public function toString(): string {
        return match($this) {
            self::I => "I",
            self::II => "II",
            self::III => "III"
        };
    }

}