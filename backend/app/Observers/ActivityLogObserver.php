<?php

declare(strict_types=1);

namespace App\Observers;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Log;

final class ActivityLogObserver
{
    public function created(Model $model): void { Log::info('model.created', ['model' => $model::class, 'id' => $model->getKey()]); }
    public function updated(Model $model): void { Log::info('model.updated', ['model' => $model::class, 'id' => $model->getKey()]); }
    public function deleted(Model $model): void { Log::info('model.deleted', ['model' => $model::class, 'id' => $model->getKey()]); }
}
