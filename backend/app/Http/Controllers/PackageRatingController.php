<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use App\Models\ActivityLog;
use App\Models\Customer;
use App\Models\PackageBooking;
use App\Models\PackageRating;
use App\Models\TourPackage;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

/**
 * Ratings for tour packages, gated on an actual completed purchase.
 *
 * Eligibility is deliberately NOT "has a booking". It is "has travelled":
 *
 *   status = completed
 *   OR (status = paid AND travel_date < today)
 *
 * The second arm matters operationally. Marking a booking `completed` is a
 * manual admin action, and if the office falls behind, a strict
 * `completed`-only rule would silently lock every customer out of rating a
 * trip they genuinely took. The date check keeps the guarantee honest — you
 * still cannot rate a journey that has not happened — without making the
 * feature depend on back-office diligence.
 *
 * The one-rating-per-booking rule is enforced by a unique index, not by the
 * existence check below; the check is only there to return a friendly 422
 * instead of a database error.
 */
final class PackageRatingController extends Controller
{
    /** POST /package-ratings */
    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'package_booking_id' => ['required', 'integer'],
            'stars' => ['required', 'integer', 'between:1,5'],
            'comment' => ['nullable', 'string', 'max:1000'],
        ]);

        $customer = Customer::where('user_id', $request->user()->id)->firstOrFail();

        // Scoping the lookup to this customer means an id belonging to someone
        // else is a plain 404 — no "that booking exists but isn't yours".
        $booking = PackageBooking::query()
            ->where('id', $data['package_booking_id'])
            ->where('customer_id', $customer->id)
            ->firstOrFail();

        abort_unless($this->hasTravelled($booking), 422, 'Anda baru bisa memberi rating setelah perjalanan selesai.');

        abort_if(
            PackageRating::where('package_booking_id', $booking->id)->exists(),
            422,
            'Anda sudah memberi rating untuk pemesanan ini.',
        );

        $rating = PackageRating::create([
            'tour_package_id' => $booking->tour_package_id,
            'customer_id' => $customer->id,
            'package_booking_id' => $booking->id,
            'stars' => (int) $data['stars'],
            'comment' => $data['comment'] ?? null,
        ]);

        ActivityLog::create([
            'action' => 'package.rated',
            'subject_type' => 'TourPackage',
            'subject_id' => $booking->tour_package_id,
            'metadata' => ['booking_id' => $booking->id, 'stars' => $rating->stars, 'ip' => $request->ip()],
        ]);

        return response()->json(['success' => true, 'message' => 'Terima kasih atas penilaian Anda.', 'data' => $rating], 201);
    }

    /**
     * GET /package-ratings/eligibility
     *
     * Bookings this customer may still rate. The UI uses it to decide which
     * trips to prompt about, so it never offers a form that would be rejected.
     */
    public function eligibility(Request $request): JsonResponse
    {
        $customer = Customer::where('user_id', $request->user()->id)->first();
        if ($customer === null) {
            return response()->json(['data' => []]);
        }

        $rated = PackageRating::where('customer_id', $customer->id)->pluck('package_booking_id');

        $bookings = PackageBooking::query()
            ->with('package:id,name,slug,cover_path')
            ->where('customer_id', $customer->id)
            ->whereNotIn('id', $rated)
            ->where(fn ($q) => $q
                ->where('status', 'completed')
                ->orWhere(fn ($p) => $p->where('status', 'paid')->whereDate('travel_date', '<', now()->toDateString())))
            ->orderByDesc('travel_date')
            ->limit(20)
            ->get(['id', 'uuid', 'code', 'tour_package_id', 'travel_date', 'status']);

        return response()->json(['data' => $bookings]);
    }

    /**
     * GET /catalog/tour-packages/{slug}/ratings — public.
     *
     * Reviewer names are shortened to a first name plus an initial. A review
     * page is a public directory of who bought what and when; the full legal
     * name of every customer does not need to be on it.
     */
    public function index(string $slug): JsonResponse
    {
        $package = TourPackage::where('slug', $slug)->firstOrFail(['id']);

        $summary = PackageRating::where('tour_package_id', $package->id)
            ->selectRaw('COUNT(*) as total, AVG(stars) as average')
            ->first();

        $distribution = PackageRating::where('tour_package_id', $package->id)
            ->select('stars', DB::raw('COUNT(*) as total'))
            ->groupBy('stars')
            ->pluck('total', 'stars');

        $reviews = PackageRating::query()
            ->with('customer.user:id,name')
            ->where('tour_package_id', $package->id)
            ->whereNotNull('comment')
            ->latest('id')
            ->limit(20)
            ->get(['id', 'customer_id', 'stars', 'comment', 'created_at'])
            ->map(fn (PackageRating $r): array => [
                'id' => $r->id,
                'stars' => $r->stars,
                'comment' => $r->comment,
                'name' => $this->shortName($r->customer?->user?->name),
                'created_at' => $r->created_at?->toDateString(),
            ]);

        return response()->json(['data' => [
            'average' => round((float) ($summary->average ?? 0), 2),
            'total' => (int) ($summary->total ?? 0),
            'distribution' => [
                5 => (int) ($distribution[5] ?? 0),
                4 => (int) ($distribution[4] ?? 0),
                3 => (int) ($distribution[3] ?? 0),
                2 => (int) ($distribution[2] ?? 0),
                1 => (int) ($distribution[1] ?? 0),
            ],
            'reviews' => $reviews,
        ]]);
    }

    /** Travelled = completed, or paid with the travel date already behind us. */
    private function hasTravelled(PackageBooking $booking): bool
    {
        if ($booking->status === 'completed') {
            return true;
        }

        return $booking->status === 'paid'
            && $booking->travel_date !== null
            && now()->toDateString() > (string) $booking->travel_date->toDateString();
    }

    /** "Budi Santoso" -> "Budi S." */
    private function shortName(?string $name): string
    {
        $name = trim((string) $name);
        if ($name === '') {
            return 'Pelanggan';
        }

        $parts = preg_split('/\s+/', $name) ?: [];
        if (count($parts) === 1) {
            return $parts[0];
        }

        return $parts[0].' '.mb_strtoupper(mb_substr((string) end($parts), 0, 1)).'.';
    }
}
