<?php

declare(strict_types=1);

namespace App\Modules\Catalog\Presentation;

use App\Modules\Catalog\Application\Services\CatalogService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Routing\Controller;

final class CatalogController extends Controller
{
    public function __construct(private readonly CatalogService $catalog) {}

    public function routes(): JsonResponse
    {
        return response()->json(['success' => true, 'message' => 'Daftar rute berhasil diambil.', 'data' => $this->catalog->routes()]);
    }

    public function schedules(Request $request): JsonResponse
    {
        $filters = $request->validate([
            'origin' => ['sometimes', 'nullable', 'string', 'max:100'],
            'destination' => ['sometimes', 'nullable', 'string', 'max:100'],
            'date' => ['sometimes', 'nullable', 'date'],
            'route_id' => ['sometimes', 'nullable', 'integer'],
        ]);

        return response()->json(['success' => true, 'message' => 'Jadwal berhasil diambil.', 'data' => $this->catalog->schedules($filters)]);
    }

    public function seats(string $schedule): JsonResponse
    {
        return response()->json(['success' => true, 'message' => 'Ketersediaan kursi berhasil diambil.', 'data' => $this->catalog->seats($schedule)]);
    }

    /**
     * Public branding & contact settings used by the footer, CS button and
     * jastip button. Only whitelisted, non-sensitive keys are exposed.
     */
    public function publicSettings(): JsonResponse
    {
        $keys = [
            'company_name', 'whatsapp_number', 'cs_whatsapp', 'jastip_whatsapp',
            'social_instagram', 'social_tiktok', 'social_facebook', 'welcome_notice',
        ];
        $rows = \App\Models\SystemSetting::query()->whereIn('key', $keys)->pluck('value', 'key');
        $data = [];
        foreach ($keys as $key) {
            $value = $rows[$key] ?? null;
            if (is_array($value) && array_key_exists('value', $value)) {
                $value = $value['value'];
            }
            $data[$key] = $value;
        }
        return response()->json(['success' => true, 'message' => 'Pengaturan publik.', 'data' => $data]);
    }
}
