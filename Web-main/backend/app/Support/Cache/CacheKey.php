<?php

namespace App\Support\Cache;

enum CacheKey: string { case Routes = 'routes'; case Schedules = 'schedules'; case Pricing = 'pricing'; case Settings = 'settings'; case Dashboard = 'dashboard'; }
