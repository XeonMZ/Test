<?php
use App\Modules\Drivers\Application\StateMachines\DriverShiftStateMachine;
use PHPUnit\Framework\TestCase;
final class DriverShiftStateMachineTest extends TestCase { public function test_shift_flow(): void { $m=new DriverShiftStateMachine(); $s=$m->transition(DriverShiftStateMachine::OFFLINE,DriverShiftStateMachine::AVAILABLE); $s=$m->transition($s,DriverShiftStateMachine::ON_DUTY); $s=$m->transition($s,DriverShiftStateMachine::ON_TRIP); $s=$m->transition($s,DriverShiftStateMachine::FINISHED); self::assertSame(DriverShiftStateMachine::FINISHED,$s); }}
