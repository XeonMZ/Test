<?php

namespace App\Support\Enums;

enum TripStatus: string { case Draft = 'draft'; case Published = 'published'; case Full = 'full'; case Departed = 'departed'; case Finished = 'finished'; case Cancelled = 'cancelled'; }
