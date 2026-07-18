<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use App\Models\ActivityLog;
use App\Models\AuditTrail;
use App\Models\CmsSection;
use App\Models\TourPackage;
use App\Support\Audit\RequestContext;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * Tour Package CMS + Home/Content CMS.
 * Admin & owner manage everything through the UI; customers consume the
 * public catalog endpoints (published content only). Every mutation lands in
 * the existing audit trail.
 */
final class CmsController extends Controller
{
    // ------------------------- Tour Packages -------------------------

    public function packages(Request $request): JsonResponse
    {
        $q = TourPackage::query()->orderBy('sort_order')->orderByDesc('id');
        if ($search = $request->string('search')->toString()) {
            $q->where(fn ($x) => $x->where('name', 'like', "%{$search}%")->orWhere('destination', 'like', "%{$search}%"));
        }
        if ($status = $request->string('status')->toString()) {
            $q->where('status', $status);
        }
        return response()->json(['data' => $q->paginate(min(100, max(1, (int) $request->query('per_page', '20'))))]);
    }

    public function packageStore(Request $request): JsonResponse
    {
        $package = TourPackage::create($this->packageData($request));
        $this->audit($request, 'cms.package_created', ['id' => $package->id, 'name' => $package->name]);
        return response()->json(['data' => $package], 201);
    }

    public function packageUpdate(Request $request, string $id): JsonResponse
    {
        $package = TourPackage::findOrFail($id);
        $data = $this->packageData($request, (int) $id, partial: true);
        $before = $package->only(array_keys($data));
        $package->update($data);
        $this->audit($request, 'cms.package_updated', ['id' => $package->id, 'before' => $before]);
        return response()->json(['data' => $package->fresh()]);
    }

    public function packageDestroy(Request $request, string $id): JsonResponse
    {
        $package = TourPackage::findOrFail($id);
        $package->delete();
        $this->audit($request, 'cms.package_deleted', ['id' => (int) $id, 'name' => $package->name]);
        return response()->json(['data' => ['deleted' => true]]);
    }

    /** @return array<string, mixed> */
    private function packageData(Request $request, ?int $ignoreId = null, bool $partial = false): array
    {
        $req = $partial ? 'sometimes' : 'required';
        return $request->validate([
            'name' => "{$req}|string|max:150",
            'description' => 'sometimes|nullable|string|max:8000',
            'destination' => 'sometimes|nullable|string|max:150',
            'duration_days' => 'sometimes|integer|min:1|max:60',
            'facilities' => 'sometimes|nullable|array',
            'facilities.*' => 'string|max:120',
            'itinerary' => 'sometimes|nullable|array',
            'price' => "{$req}|numeric|min:0",
            'capacity' => 'sometimes|integer|min:0|max:1000',
            'cover_path' => 'sometimes|nullable|string|max:255',
            'gallery' => 'sometimes|nullable|array',
            'gallery.*' => 'string|max:255',
            'status' => 'sometimes|in:active,inactive',
            'badge' => 'sometimes|nullable|string|max:32',
            'is_featured' => 'sometimes|boolean',
            'is_recommended' => 'sometimes|boolean',
            'is_best_seller' => 'sometimes|boolean',
            'is_promo' => 'sometimes|boolean',
            'sort_order' => 'sometimes|integer|min:0|max:9999',
        ]);
    }

    // --------------------------- CMS Sections ---------------------------

    public function sections(Request $request): JsonResponse
    {
        $q = CmsSection::query()->orderBy('section_type')->orderBy('sort_order');
        if ($type = $request->string('type')->toString()) {
            $q->where('section_type', $type);
        }
        return response()->json(['data' => $q->paginate(min(200, max(1, (int) $request->query('per_page', '100'))))]);
    }

    public function sectionStore(Request $request): JsonResponse
    {
        $section = CmsSection::create($this->sectionData($request));
        $this->audit($request, 'cms.section_created', ['id' => $section->id, 'type' => $section->section_type]);
        return response()->json(['data' => $section], 201);
    }

    public function sectionUpdate(Request $request, string $id): JsonResponse
    {
        $section = CmsSection::findOrFail($id);
        $data = $this->sectionData($request, partial: true);
        $before = $section->only(array_keys($data));
        $section->update($data);
        $this->audit($request, 'cms.section_updated', ['id' => $section->id, 'type' => $section->section_type, 'before' => $before]);
        return response()->json(['data' => $section->fresh()]);
    }

    public function sectionDestroy(Request $request, string $id): JsonResponse
    {
        $section = CmsSection::findOrFail($id);
        $section->delete();
        $this->audit($request, 'cms.section_deleted', ['id' => (int) $id, 'type' => $section->section_type]);
        return response()->json(['data' => ['deleted' => true]]);
    }

    /** @return array<string, mixed> */
    private function sectionData(Request $request, bool $partial = false): array
    {
        $req = $partial ? 'sometimes' : 'required';
        return $request->validate([
            'section_type' => "{$req}|in:".implode(',', CmsSection::TYPES),
            'title' => 'sometimes|nullable|string|max:200',
            'body' => 'sometimes|nullable|string|max:8000',
            'image_path' => 'sometimes|nullable|string|max:255',
            'link' => 'sometimes|nullable|string|max:255',
            'sort_order' => 'sometimes|integer|min:0|max:9999',
            'is_active' => 'sometimes|boolean',
            'publish_start' => 'sometimes|nullable|date',
            'publish_end' => 'sometimes|nullable|date|after_or_equal:publish_start',
            'metadata' => 'sometimes|nullable|array',
        ]);
    }

    // ------------------------- Public catalog -------------------------

    /** Published packages, optionally filtered by section flag. */
    public function catalogPackages(Request $request): JsonResponse
    {
        $q = TourPackage::query()->where('status', 'active')->orderBy('sort_order')->orderByDesc('id');
        match ($request->string('filter')->toString()) {
            'featured' => $q->where('is_featured', true),
            'recommended' => $q->where('is_recommended', true),
            'best_seller' => $q->where('is_best_seller', true),
            'promo' => $q->where('is_promo', true),
            default => null,
        };
        return response()->json(['data' => $q->paginate(min(50, max(1, (int) $request->query('per_page', '12'))))]);
    }

    public function catalogPackageShow(string $slug): JsonResponse
    {
        return response()->json(['data' => TourPackage::where('status', 'active')->where('slug', $slug)->firstOrFail()]);
    }

    /** The whole dynamic home page: published sections grouped by type. */
    public function catalogHome(): JsonResponse
    {
        $sections = CmsSection::query()->published()->orderBy('sort_order')->get()->groupBy('section_type');
        return response()->json(['data' => $sections]);
    }

    private function audit(Request $request, string $action, array $meta): void
    {
        $meta = RequestContext::enrich($request, $meta);
        AuditTrail::record($action, 'Cms', 'user', (string) $request->user()?->id, $meta);
        ActivityLog::create(['action' => $action, 'subject_type' => 'Cms', 'subject_id' => $meta['id'] ?? null, 'metadata' => $meta]);
    }
}
