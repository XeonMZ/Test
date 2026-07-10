<?php
use App\Modules\Gps\Domain\Entities\DriverLocation;
use PHPUnit\Framework\TestCase;
final class GpsEntityTest extends TestCase { public function test_driver_location_carries_tracking_metadata(): void { $l=new DriverLocation('1','2',-6.2,106.8,'now',40.5,180.0,5.0,80,'now'); self::assertSame(40.5,$l->speed); self::assertSame(180.0,$l->heading); self::assertSame(5.0,$l->accuracy); self::assertSame(80,$l->battery); self::assertSame('now',$l->lastSeen); }}
