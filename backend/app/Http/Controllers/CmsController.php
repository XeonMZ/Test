<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use App\Models\ActivityLog;
use App\Models\AuditTrail;
use App\Models\CmsSection;
use App\Models\CmsVersion;
use App\Models\TourPackage;
use App\Support\Audit\RequestContext;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

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
        // Aggregates come from the database, not from loading every rating:
        // a package with thousands of reviews must not cost thousands of rows
        // to render one card.
        $q = TourPackage::query()
            ->withCount('ratings')
            ->withAvg('ratings', 'stars')
            ->where('status', 'active')->orderBy('sort_order')->orderByDesc('id');
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
        $package = TourPackage::query()
            ->withCount('ratings')
            ->withAvg('ratings', 'stars')
            ->where('status', 'active')
            ->where('slug', $slug)
            ->firstOrFail();

        return response()->json(['data' => $package]);
    }

    /**
     * Cards for the swipeable recommendation rail on the customer dashboard.
     *
     * Kept separate from catalogHome() rather than filtered client-side: the
     * dashboard would otherwise download every hero, FAQ and footer block just
     * to render two cards, on the connection of someone already logged in on
     * a phone.
     *
     * `link` is emitted only when it is safe to put in an href. A CMS editor
     * is trusted to write copy, not to inject a scheme — `javascript:` or
     * `data:` here would be stored XSS against every logged-in customer, so
     * anything that is not http(s) or a site-relative path is dropped.
     */
    public function catalogRecommendations(): JsonResponse
    {
        $sections = CmsSection::query()
            ->published()
            ->where('section_type', CmsSection::TYPE_RECOMMENDATION)
            ->orderBy('sort_order')
            ->orderBy('id')
            ->limit(20)
            ->get(['id', 'title', 'body', 'image_path', 'link', 'sort_order', 'metadata'])
            ->map(function (CmsSection $section): array {
                return [
                    'id' => $section->id,
                    'title' => $section->title,
                    'body' => $section->body,
                    'image_path' => $section->image_path,
                    'link' => $this->safeLink($section->link),
                    'badge' => is_array($section->metadata) ? ($section->metadata['badge'] ?? null) : null,
                ];
            })
            ->values();

        return response()->json(['data' => $sections]);
    }

    /**
     * GET /catalog/hero-slides
     *
     * The hero carousel as standalone data, for pages that are not driven by
     * the CMS block renderer (the customer package page). The home page gets
     * the same rows through /catalog/home and groups them client-side.
     */
    public function catalogHeroSlides(): JsonResponse
    {
        $slides = CmsSection::query()
            ->published()
            ->where('section_type', CmsSection::TYPE_HERO_SLIDER)
            ->orderBy('sort_order')
            ->orderBy('id')
            ->limit(12)
            ->get(['id', 'title', 'body', 'image_path', 'link', 'metadata'])
            ->map(fn (CmsSection $s): array => [
                'id' => $s->id,
                'title' => $s->title,
                'body' => $s->body,
                'image_path' => $s->image_path,
                'link' => $this->safeLink($s->link),
                'cta_label' => is_array($s->metadata) ? ($s->metadata['cta_label'] ?? null) : null,
            ])
            ->values();

        return response()->json(['data' => $slides]);
    }

    /** Allow site-relative paths and absolute http(s) only; drop everything else. */
    private function safeLink(?string $link): ?string
    {
        $link = trim((string) $link);
        if ($link === '') {
            return null;
        }

        // Site-relative: must start with a single slash, never '//host'
        // (protocol-relative, which escapes to another origin).
        if (str_starts_with($link, '/') && ! str_starts_with($link, '//')) {
            return $link;
        }

        $scheme = parse_url($link, PHP_URL_SCHEME);

        return in_array(strtolower((string) $scheme), ['http', 'https'], true) ? $link : null;
    }

    /** The whole dynamic home page: published sections grouped by type. */
    public function catalogHome(): JsonResponse
    {
        // Flat, ordered list of published blocks — the public renderer lays
        // them out in exactly the order set in the Page Builder.
        $sections = CmsSection::query()->published()
            // Recommendation cards belong to the customer dashboard rail, not
            // the public home page. The renderer already ignores unknown
            // types, but there is no reason to ship them to every visitor.
            ->where('section_type', '!=', CmsSection::TYPE_RECOMMENDATION)
            ->orderBy('sort_order')->orderBy('id')
            ->get(['id', 'section_type', 'title', 'body', 'image_path', 'link', 'sort_order', 'is_active', 'metadata']);
        return response()->json(['data' => $sections]);
    }

    // ------------------- Centralized CMS: versions -------------------

    /** Snapshot the whole CMS state as a draft or published version. */
    public function saveVersion(Request $request): JsonResponse
    {
        $data = $request->validate([
            'label' => 'sometimes|nullable|string|max:120',
            'status' => 'sometimes|in:draft,published',
        ]);
        $status = $data['status'] ?? 'draft';

        $snapshot = [
            'sections' => CmsSection::query()->orderBy('section_type')->orderBy('sort_order')->get()->toArray(),
            'branding' => $this->brandingPayload(),
            'taken_at' => now()->toIso8601String(),
        ];

        $version = CmsVersion::create([
            'label' => $data['label'] ?? ('Snapshot '.now()->format('d M Y H:i')),
            'status' => $status,
            'snapshot' => $snapshot,
            'created_by' => $request->user()?->id,
            'published_at' => $status === 'published' ? now() : null,
        ]);

        if ($status === 'published') {
            // Mark previous published versions superseded (kept for history).
            CmsVersion::where('status', 'published')->whereKeyNot($version->id)->update(['status' => 'draft']);
        }

        $this->audit($request, $status === 'published' ? 'cms.version_published' : 'cms.version_saved', ['id' => $version->id, 'label' => $version->label]);
        return response()->json(['data' => $version], 201);
    }

    public function versions(Request $request): JsonResponse
    {
        return response()->json(['data' => CmsVersion::with('createdBy:id,name')
            ->latest('id')->paginate(min(50, max(1, (int) $request->query('per_page', '20'))))]);
    }

    /** Restore a version: re-materialise its sections into cms_sections. */
    public function restoreVersion(Request $request, string $id): JsonResponse
    {
        $version = CmsVersion::findOrFail($id);
        $sections = $version->snapshot['sections'] ?? [];

        DB::transaction(function () use ($sections): void {
            CmsSection::query()->forceDelete();
            foreach ($sections as $s) {
                CmsSection::create([
                    'uuid' => (string) Str::uuid(),
                    'section_type' => $s['section_type'] ?? 'hero',
                    'title' => $s['title'] ?? null,
                    'body' => $s['body'] ?? null,
                    'image_path' => $s['image_path'] ?? null,
                    'link' => $s['link'] ?? null,
                    'sort_order' => (int) ($s['sort_order'] ?? 0),
                    'is_active' => (bool) ($s['is_active'] ?? true),
                    'publish_start' => $s['publish_start'] ?? null,
                    'publish_end' => $s['publish_end'] ?? null,
                    'metadata' => $s['metadata'] ?? null,
                ]);
            }
        });

        $this->audit($request, 'cms.version_restored', ['id' => $version->id, 'label' => $version->label]);
        return response()->json(['data' => ['restored' => true, 'sections' => count($sections)]]);
    }

    // ------------------- Centralized CMS: branding -------------------

    /** Branding/typography/SEO/company profile — stored in System Settings. */
    public function branding(): JsonResponse
    {
        return response()->json(['data' => $this->brandingPayload()]);
    }

    public function brandingUpdate(Request $request): JsonResponse
    {
        $data = $request->validate([
            'logo_path' => 'sometimes|nullable|string|max:255',
            'primary_color' => 'sometimes|nullable|string|max:16',
            'font_family' => 'sometimes|nullable|string|max:64',
            'company_name' => 'sometimes|nullable|string|max:150',
            'company_tagline' => 'sometimes|nullable|string|max:255',
            'social' => 'sometimes|nullable|array',
            'seo' => 'sometimes|nullable|array',
        ]);
        foreach ($data as $key => $value) {
            \App\Models\SystemSetting::updateOrCreate(['key' => 'cms_'.$key], ['value' => $value, 'is_public' => true]);
        }
        $this->audit($request, 'cms.branding_updated', ['keys' => array_keys($data)]);
        return response()->json(['data' => $this->brandingPayload()]);
    }

    /** @return array<string, mixed> */
    private function brandingPayload(): array
    {
        $keys = ['logo_path', 'primary_color', 'font_family', 'company_name', 'company_tagline', 'social', 'seo'];
        $out = [];
        foreach ($keys as $k) {
            $value = \App\Models\SystemSetting::query()->where('key', 'cms_'.$k)->value('value');
            $out[$k] = is_array($value) ? ($value['value'] ?? $value) : $value;
        }
        return $out;
    }

    /** General image upload (cover/gallery) — reuses the public storage disk. */
    public function upload(Request $request): JsonResponse
    {
        $request->validate(['image' => 'required|image|mimes:jpg,jpeg,png,webp|max:6144']);
        $path = $request->file('image')->store('cms', 'public');
        $this->audit($request, 'cms.image_uploaded', ['path' => $path]);
        return response()->json(['data' => ['path' => $path, 'url' => asset('storage/'.$path)]], 201);
    }

    private function audit(Request $request, string $action, array $meta): void
    {
        $meta = RequestContext::enrich($request, $meta);
        AuditTrail::record($action, 'Cms', 'user', (string) $request->user()?->id, $meta);
        ActivityLog::create(['action' => $action, 'subject_type' => 'Cms', 'subject_id' => $meta['id'] ?? null, 'metadata' => $meta]);
    }
}
