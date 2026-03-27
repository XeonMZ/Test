<?php

declare(strict_types=1);


namespace aeroDEV\bedwars\session\setup\step;


use pocketmine\block\VanillaBlocks;
use pocketmine\event\Cancellable;
use pocketmine\event\player\PlayerInteractEvent;
use pocketmine\item\VanillaItems;
use pocketmine\math\Vector3;
use pocketmine\world\BlockTransaction;
use aeroDEV\bedwars\item\BedwarsItem;
use aeroDEV\bedwars\item\BedwarsItems;
use aeroDEV\bedwars\item\setup\SetBedPositionItem;
use aeroDEV\bedwars\session\setup\builder\TeamBuilder;

class SetBedPositionStep extends Step {

    private TeamBuilder $team;

    public function __construct(TeamBuilder $team) {
        $this->team = $team;
    }

    protected function onStart(): void {
        $this->session->clearAllInventories();
        $this->session->message("{YELLOW}Place the bed you received in your inventory to set the position.");

        $inventory = $this->session->getPlayer()->getInventory();
        $inventory->setItem(0, BedwarsItems::BED_POSITION()->setColor($this->team->getDyeColor())->asItem());
        $inventory->setItem(8, BedwarsItems::CANCEL()->asItem());
    }

    public function onBlockInteract(Vector3 $touch_vector, int $action, Cancellable $event, BedwarsItem $item): void {
        if($item instanceof SetBedPositionItem and $action === PlayerInteractEvent::RIGHT_CLICK_BLOCK) {
            $this->team->setBedPosition($touch_vector);
            
            $this->session->getMapSetup()->setStep(new PreparingMapStep());
            $this->session->message("{GREEN}You have successfully set the bed position.");

            $event->uncancel();
        }
    }

}