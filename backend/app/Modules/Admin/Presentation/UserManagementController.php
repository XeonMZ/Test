<?php

declare(strict_types=1);

namespace App\Modules\Admin\Presentation;

use App\Models\AuditTrail;
use App\Models\Driver;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Routing\Controller;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rules\Password;

/**
 * #1 Staff & driver management.
 *
 * Access rules (enforced here, on top of route middleware):
 *   - Only OWNER may create/list ADMIN accounts.
 *   - OWNER and ADMIN may create/list DRIVER accounts.
 * Owner is the super-role: it can do everything admin can, plus manage admins.
 */
final class UserManagementController extends Controller
{
    private function actorRole(Request $request): string
    {
        return (string) ($request->user()?->role ?? '');
    }

    private function log(Request $request, string $action, array $meta): void
    {
        $meta = \App\Support\Audit\RequestContext::enrich($request, $meta);
        AuditTrail::record($action, 'User', 'user', (string) $request->user()?->id, $meta);
        \App\Models\ActivityLog::create(['action' => $action, 'subject_type' => 'User', 'subject_id' => $meta['id'] ?? null, 'metadata' => $meta]);
    }

    // ------------------------------- Admins -------------------------------

    public function admins(Request $request): JsonResponse
    {
        abort_unless($this->actorRole($request) === 'owner', 403, 'Hanya owner yang dapat melihat daftar admin.');
        $admins = User::query()->where('role', 'admin')->latest('id')->paginate(min(50, (int) $request->integer('per_page', 15)), ['id', 'name', 'email', 'role', 'created_at']);
        return response()->json(['data' => $admins]);
    }

    public function adminStore(Request $request): JsonResponse
    {
        abort_unless($this->actorRole($request) === 'owner', 403, 'Hanya owner yang dapat menambah admin.');
        $data = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|email|max:254|unique:users,email',
            'password' => ['required', 'confirmed', Password::defaults()],
        ]);
        $admin = User::create([
            'name' => $data['name'],
            'email' => $data['email'],
            'password' => Hash::make($data['password']),
            'role' => 'admin',
        ]);
        $this->log($request, 'admin.created', ['id' => $admin->id, 'email' => $admin->email]);
        return response()->json(['data' => $admin->only(['id', 'name', 'email', 'role'])], 201);
    }

    /**
     * Owner resets/changes an admin's password. All of the admin's API tokens
     * are revoked so stale sessions cannot keep using the old credential.
     */
    public function adminResetPassword(Request $request, string $id): JsonResponse
    {
        abort_unless($this->actorRole($request) === 'owner', 403, 'Hanya owner yang dapat mereset password admin.');
        $admin = User::where('role', 'admin')->findOrFail($id);
        $data = $request->validate(['password' => ['required', 'confirmed', Password::defaults()]]);

        $admin->update(['password' => Hash::make($data['password'])]);
        $admin->tokens()->delete();

        $this->log($request, 'admin.password_reset', ['id' => $admin->id, 'email' => $admin->email]);
        return response()->json(['data' => ['reset' => true]]);
    }

    public function adminDestroy(Request $request, string $id): JsonResponse
    {
        abort_unless($this->actorRole($request) === 'owner', 403, 'Hanya owner yang dapat menghapus admin.');
        $admin = User::where('role', 'admin')->findOrFail($id);
        $admin->delete();
        $this->log($request, 'admin.deleted', ['id' => (int) $id]);
        return response()->json(['data' => ['deleted' => true]]);
    }

    // ------------------------------- Drivers ------------------------------

    public function drivers(Request $request): JsonResponse
    {
        abort_unless(in_array($this->actorRole($request), ['owner', 'admin'], true), 403, 'Akses ditolak.');
        $drivers = Driver::query()->with('user:id,name,email')->latest('id')->paginate(min(50, (int) $request->integer('per_page', 15)));
        return response()->json(['data' => $drivers]);
    }

    public function driverStore(Request $request): JsonResponse
    {
        abort_unless(in_array($this->actorRole($request), ['owner', 'admin'], true), 403, 'Hanya owner/admin yang dapat menambah driver.');
        $data = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|email|max:254|unique:users,email',
            'password' => ['required', 'confirmed', Password::defaults()],
            'license_number' => 'required|string|max:64|unique:drivers,license_number',
        ]);

        $driver = DB::transaction(function () use ($data): Driver {
            $user = User::create([
                'name' => $data['name'],
                'email' => $data['email'],
                'password' => Hash::make($data['password']),
                'role' => 'driver',
            ]);
            return Driver::create([
                'user_id' => $user->id,
                'license_number' => $data['license_number'],
                'status' => 'available',
            ]);
        });

        $this->log($request, 'driver.created', ['id' => $driver->id]);
        return response()->json(['data' => $driver->load('user:id,name,email')], 201);
    }

    public function driverUpdate(Request $request, string $id): JsonResponse
    {
        abort_unless(in_array($this->actorRole($request), ['owner', 'admin'], true), 403, 'Akses ditolak.');
        $driver = Driver::findOrFail($id);
        $data = $request->validate([
            'status' => 'sometimes|string|in:available,offline,suspended',
            'license_number' => 'sometimes|string|max:64|unique:drivers,license_number,'.$driver->id,
            // #2 Full profile fields filled by admin/owner.
            'phone' => 'sometimes|nullable|string|max:32',
            'vehicle_name' => 'sometimes|nullable|string|max:255',
            'vehicle_plate' => 'sometimes|nullable|string|max:32',
            'name' => 'sometimes|string|max:255',
        ]);
        if (isset($data['name']) && $driver->user) {
            $driver->user->update(['name' => $data['name']]);
            unset($data['name']);
        }
        $before = $driver->only(array_keys($data));
        $driver->update($data);
        $this->log($request, 'driver.updated', ['id' => $driver->id, 'before' => $before, 'after' => $driver->only(array_keys($data))]);
        return response()->json(['data' => $driver->fresh('user:id,name,email')]);
    }

    /** #2 Upload driver photo (admin/owner). */
    public function driverPhoto(Request $request, string $id): JsonResponse
    {
        abort_unless(in_array($this->actorRole($request), ['owner', 'admin'], true), 403, 'Akses ditolak.');
        $driver = Driver::findOrFail($id);
        $request->validate(['photo' => 'required|image|max:4096']);
        $path = $request->file('photo')->store('drivers', 'public');
        $driver->update(['photo_path' => $path]);
        $this->log($request, 'driver.photo', ['id' => $driver->id]);
        return response()->json(['data' => ['photo_url' => asset('storage/'.$path)]]);
    }

    /** #2 Ratings & feedback for a driver, visible to admin/owner. */
    public function driverRatings(Request $request, string $id): JsonResponse
    {
        abort_unless(in_array($this->actorRole($request), ['owner', 'admin'], true), 403, 'Akses ditolak.');
        $driver = Driver::findOrFail($id);
        $ratings = \App\Models\DriverRating::query()
            ->where('driver_id', $driver->id)
            ->with('customer.user:id,name')
            ->latest()
            ->paginate(min(50, (int) $request->integer('per_page', 15)));
        return response()->json(['data' => [
            'summary' => ['rating_avg' => (float) $driver->rating_avg, 'rating_count' => (int) $driver->rating_count],
            'ratings' => $ratings,
        ]]);
    }
}
