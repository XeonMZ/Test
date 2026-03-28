<?php

declare(strict_types=1);


namespace aeroDEV\bedwars\session\setup\step\area;


use aeroDEV\bedwars\game\team\Area;

class SetClaimStep extends SetAreaStep {

    protected function setArea(Area $area): void {
        $this->team->setClaim($area);
    }

}