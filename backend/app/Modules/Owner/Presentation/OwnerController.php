<?php

declare(strict_types=1);

namespace App\Modules\Owner\Presentation;

use App\Models\Booking;
use App\Models\Customer;
use App\Models\Driver;
use App\Models\Payment;
use App\Models\Route;
use App\Models\Schedule;
use App\Models\Ticket;
use App\Models\Vehicle;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Routing\Controller;
use Illuminate\Support\Carbon;

/**
 * Owner-level business intelligence: aggregated KPIs and revenue,
 * computed directly from the operational tables (no fake data).
 */
final class OwnerController extends Controller
{
    private const REVENUE_STATUSES = ['paid', 'ticket_generated', 'completed'];

    public function analytics(): JsonResponse
    {
        $now = now();
        $monthStart = $now->copy()->startOfMonth();

        $revenueTotal = (float) Booking::whereIn('status', self::REVENUE_STATUSES)->sum('amount');
        $revenueThisMonth = (float) Booking::whereIn('status', self::REVENUE_STATUSES)->where('created_at', '>=', $monthStart)->sum('amount');

        $bookingsByStatus = Booking::query()
            ->selectRaw('status, count(*) as total')
            ->groupBy('status')
            ->pluck('total', 'status');

        $dailyBookings = $this->dailySeries(Booking::query(), $now, 14, countOnly: true);

        $topRoutes = Booking::query()
            ->join('schedules', 'schedules.id', '=', 'bookings.schedule_id')
            ->join('routes', 'routes.id', '=', 'schedules.route_id')
            ->whereIn('bookings.status', self::REVENUE_STATUSES)
            ->selectRaw("routes.code, routes.origin, routes.destination, count(*) as bookings, sum(bookings.amount) as revenue")
            ->groupBy('routes.id', 'routes.code', 'routes.origin', 'routes.destination')
            ->orderByDesc('revenue')
            ->limit(5)
            ->get();

        return response()->json(['success' => true, 'message' => 'Analytics berhasil diambil.', 'data' => [
            'kpis' => [
                'total_revenue' => $revenueTotal,
                'revenue_this_month' => $revenueThisMonth,
                'total_bookings' => Booking::count(),
                'paid_bookings' => Booking::whereIn('status', self::REVENUE_STATUSES)->count(),
                'total_customers' => Customer::count(),
                'total_drivers' => Driver::count(),
                'active_vehicles' => Vehicle::where('status', 'active')->count(),
                'upcoming_schedules' => Schedule::where('status', 'scheduled')->where('departure_at', '>', $now)->count(),
                'tickets_issued' => Ticket::count(),
            ],
            'bookings_by_status' => $bookingsByStatus,
            'daily_bookings' => $dailyBookings,
            'top_routes' => $topRoutes,
        ]]);
    }

    public function featureFlags(): JsonResponse
    {
        return response()->json(['success' => true, 'message' => 'Feature flags berhasil diambil.', 'data' => \App\Models\FeatureFlag::query()->orderBy('key')->get(['id', 'key', 'enabled', 'updated_at'])]);
    }

    public function toggleFeatureFlag(Request $request, \App\Support\Cache\CacheStore $cache): JsonResponse
    {
        $data = $request->validate(['key' => ['required', 'string', 'exists:feature_flags,key'], 'enabled' => ['required', 'boolean']]);

        $flag = \App\Models\FeatureFlag::where('key', $data['key'])->firstOrFail();
        $flag->update(['enabled' => $data['enabled']]);
        $cache->forget('feature:'.$flag->key);

        return response()->json(['success' => true, 'message' => 'Feature flag diperbarui.', 'data' => $flag->only(['id', 'key', 'enabled', 'updated_at'])]);
    }

    public function revenue(Request $request): JsonResponse
    {
        $days = min(90, max(7, (int) $request->query('days', 30)));
        $now = now();

        $daily = $this->dailySeries(Booking::whereIn('status', self::REVENUE_STATUSES), $now, $days, countOnly: false);

        $byRoute = Booking::query()
            ->join('schedules', 'schedules.id', '=', 'bookings.schedule_id')
            ->join('routes', 'routes.id', '=', 'schedules.route_id')
            ->whereIn('bookings.status', self::REVENUE_STATUSES)
            ->selectRaw('routes.code, routes.origin, routes.destination, sum(bookings.amount) as revenue, count(*) as bookings')
            ->groupBy('routes.id', 'routes.code', 'routes.origin', 'routes.destination')
            ->orderByDesc('revenue')
            ->get();

        $byPaymentStatus = Payment::query()
            ->selectRaw('status, count(*) as total, sum(amount) as amount')
            ->groupBy('status')
            ->get();

        return response()->json(['success' => true, 'message' => 'Revenue berhasil diambil.', 'data' => [
            'range_days' => $days,
            'total' => (float) Booking::whereIn('status', self::REVENUE_STATUSES)->where('created_at', '>=', $now->copy()->subDays($days))->sum('amount'),
            'daily' => $daily,
            'by_route' => $byRoute,
            'by_payment_status' => $byPaymentStatus,
        ]]);
    }

    /** @return array<int, array{date: string, total: float|int}> */
    private function dailySeries($query, Carbon $now, int $days, bool $countOnly): array
    {
        $start = $now->copy()->subDays($days - 1)->startOfDay();

        $rows = (clone $query)
            ->where('created_at', '>=', $start)
            ->selectRaw($countOnly ? 'date(created_at) as day, count(*) as total' : 'date(created_at) as day, sum(amount) as total')
            ->groupBy('day')
            ->pluck('total', 'day');

        $series = [];
        for ($i = 0; $i < $days; $i++) {
            $date = $start->copy()->addDays($i)->toDateString();
            $series[] = ['date' => $date, 'total' => $countOnly ? (int) ($rows[$date] ?? 0) : (float) ($rows[$date] ?? 0)];
        }

        return $series;
    }
}
