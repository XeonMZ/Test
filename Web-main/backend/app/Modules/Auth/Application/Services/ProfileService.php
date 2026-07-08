<?php

declare(strict_types=1);

namespace App\Modules\Auth\Application\Services;

use App\Events\ProfileUpdated;
use App\Models\User;
use Illuminate\Http\UploadedFile;

final class ProfileService
{
    public function show(User $user): User
    {
        return $user->load(['customer.membership', 'driver']);
    }

    public function update(User $user, array $data, ?UploadedFile $avatar = null): User
    {
        if (array_key_exists('name', $data)) {
            $user->name = $data['name'];
        }
        if ($avatar !== null) {
            $user->avatar_path = $avatar->store('avatars', 'public');
        }
        $user->save();
        if ($user->customer && array_key_exists('phone', $data)) {
            $user->customer->update(['phone' => $data['phone']]);
        }
        ProfileUpdated::dispatch($user, ['fields' => array_keys($data), 'avatar_uploaded' => $avatar !== null]);
        return $user->fresh(['customer.membership', 'driver']);
    }
}
