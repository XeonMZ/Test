<?php

declare(strict_types=1);

namespace Database\Seeders;

use App\Models\Customer;
use App\Models\Driver;
use App\Models\FeatureFlag;
use App\Models\Membership;
use App\Models\PricingRule;
use App\Models\Promo;
use App\Models\Route;
use App\Models\Schedule;
use App\Models\SystemSetting;
use App\Models\User;
use App\Models\Vehicle;
use App\Models\VehicleLayout;
use App\Models\VehicleSeat;
use App\Models\Voucher;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

final class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        User::create(['name'=>'Admin STMS','email'=>'admin@stms.test','password'=>Hash::make('password'),'role'=>'admin']);
        User::create(['name'=>'Owner STMS','email'=>'owner@stms.test','password'=>Hash::make('password'),'role'=>'owner']);
        $customerUser = User::create(['name'=>'Sample Customer','email'=>'customer@stms.test','password'=>Hash::make('password'),'role'=>'customer']);
        $driverUser = User::create(['name'=>'Sample Driver','email'=>'driver@stms.test','password'=>Hash::make('password'),'role'=>'driver']);
        $customer = Customer::create(['user_id'=>$customerUser->id,'phone'=>'6281234567890']);
        $driver = Driver::create(['user_id'=>$driverUser->id,'license_number'=>'SIM-A-0001','status'=>'available']);
        $layout = VehicleLayout::create(['name'=>'Executive 2-2','capacity'=>12,'metadata'=>['rows'=>3]]);
        $vehicle = Vehicle::create(['vehicle_layout_id'=>$layout->id,'plate_number'=>'B 1234 STMS','code'=>'BUS-001','brand'=>'Mercedes','status'=>'active']);
        foreach (range(1, 12) as $seat) { VehicleSeat::create(['vehicle_id'=>$vehicle->id,'seat_number'=>'A'.$seat,'class'=>'regular','is_active'=>true]); }
        $route = Route::create(['code'=>'JKT-BDG','origin'=>'Jakarta','destination'=>'Bandung','distance_km'=>150,'duration_minutes'=>180]);
        Schedule::create(['route_id'=>$route->id,'driver_id'=>$driver->id,'vehicle_id'=>$vehicle->id,'departure_at'=>now()->addDay(),'arrival_at'=>now()->addDay()->addHours(3),'base_fare'=>150000,'status'=>'scheduled']);
        PricingRule::create(['route_id'=>$route->id,'name'=>'Base weekday','amount'=>150000,'metadata'=>['type'=>'base']]);
        SystemSetting::updateOrCreate(['key'=>'timezone'], ['uuid'=>fake()->uuid(),'value'=>'Asia/Jakarta','is_public'=>true]);
        SystemSetting::updateOrCreate(['key'=>'booking.seat_lock_minutes'], ['uuid'=>fake()->uuid(),'value'=>10,'is_public'=>false]);
        FeatureFlag::updateOrCreate(['key'=>'booking_enabled'], ['uuid'=>fake()->uuid(),'enabled'=>true,'metadata'=>[]]);
        Membership::create(['customer_id'=>$customer->id,'level'=>'silver','points'=>100]);
        $promo = Promo::create(['code'=>'WELCOME','name'=>'Welcome Promo','amount'=>25000,'starts_at'=>now(),'ends_at'=>now()->addMonth()]);
        Voucher::create(['promo_id'=>$promo->id,'code'=>'WELCOME25','is_active'=>true]);
    }
}
