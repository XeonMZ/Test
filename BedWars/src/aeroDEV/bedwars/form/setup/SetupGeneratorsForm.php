<?php

declare(strict_types=1);


namespace aeroDEV\bedwars\form\setup;


use aeroDEV\bedwars\form\SimpleForm;
use aeroDEV\bedwars\session\Session;

class SetupGeneratorsForm extends SimpleForm {

    private Session $session;

    public function __construct(Session $session) {
        $this->session = $session;
        parent::__construct("Setup generators");
    }

    protected function onCreation(): void {
        $this->addRedirectFormButton("Add generator", new AddGeneratorForm($this->session));
        $this->addRedirectFormButton("Remove generator", new RemoveGeneratorsForm($this->session));
    }

}