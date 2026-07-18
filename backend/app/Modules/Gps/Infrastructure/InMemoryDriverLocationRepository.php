<?php
namespace App\Modules\Gps\Infrastructure;
use App\Modules\Gps\Domain\Entities\DriverLocation; use App\Modules\Gps\Domain\Repositories\DriverLocationRepository;
final class InMemoryDriverLocationRepository implements DriverLocationRepository { /** @var array<string,list<DriverLocation>> */ private array $history=[]; public function save(DriverLocation $location): DriverLocation { $this->history[$location->tripId][]=$location; return $location; } public function history(string $tripId): array { return $this->history[$tripId] ?? []; } public function latest(string $tripId): ?DriverLocation { $h=$this->history[$tripId] ?? []; return $h === [] ? null : $h[array_key_last($h)]; }}
