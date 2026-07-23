<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use App\Models\ActivityLog;
use App\Models\AuditTrail;
use App\Models\SiteContent;
use App\Support\Audit\RequestContext;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * Editable company profile / site content.
 *
 * Public reads are open (the landing and About pages use them). Owner & admin
 * edit from the CMS hub; every stored string is sanitized, so a compromised
 * editor account still cannot inject markup into a public page.
 */
final class SiteContentController extends Controller
{
    // ----------------------------- Public -----------------------------

    public function show(string $slug): JsonResponse
    {
        $content = SiteContent::query()->where('slug', $slug)->firstOrFail(['slug', 'payload', 'updated_at']);

        return response()->json(['success' => true, 'message' => 'Konten situs.', 'data' => $content]);
    }

    // ------------------------- Admin & owner --------------------------

    public function adminShow(string $slug): JsonResponse
    {
        abort_unless(in_array($slug, SiteContent::SLUGS, true), 404);

        return response()->json(['data' => SiteContent::with('updatedBy:id,name')->where('slug', $slug)->firstOrFail()]);
    }

    /** Replace the payload for a slug. Missing rows are created. */
    public function adminUpdate(Request $request, string $slug): JsonResponse
    {
        abort_unless(in_array($slug, SiteContent::SLUGS, true), 404);

        $data = $request->validate([
            'payload' => 'required|array',
        ]);

        $content = SiteContent::firstOrNew(['slug' => $slug]);
        $content->payload = $this->sanitizeDeep($data['payload']);
        $content->updated_by = $request->user()?->id;
        // Bump even on an identical payload so "last reviewed" stays truthful.
        $content->updated_at = now();
        $content->save();

        $meta = RequestContext::enrich($request, ['slug' => $slug]);
        AuditTrail::record('site_content.updated', 'SiteContent', 'user', (string) $request->user()?->id, $meta);
        ActivityLog::create([
            'action' => 'site_content.updated',
            'subject_type' => 'SiteContent',
            'subject_id' => null,
            'metadata' => $meta,
        ]);

        return response()->json(['data' => $content->fresh()]);
    }

    /**
     * Recursively strip markup from every string in the payload.
     * Depth-limited so a hostile payload cannot exhaust the stack.
     *
     * @param  mixed  $value
     * @return mixed
     */
    private function sanitizeDeep(mixed $value, int $depth = 0): mixed
    {
        if ($depth > 8) {
            return null;
        }

        if (is_array($value)) {
            $out = [];
            foreach ($value as $key => $item) {
                $out[is_string($key) ? $this->sanitizeString($key) : $key] = $this->sanitizeDeep($item, $depth + 1);
            }

            return $out;
        }

        if (is_string($value)) {
            return $this->sanitizeString($value);
        }

        // Scalars (int/float/bool/null) pass through untouched.
        return is_scalar($value) || $value === null ? $value : null;
    }

    private function sanitizeString(string $value): string
    {
        $value = preg_replace('#<(script|style|iframe|object|embed)\b[^>]*>.*?</\1>#is', '', $value) ?? $value;
        $value = strip_tags($value);
        $value = preg_replace('#\b(javascript|vbscript|data)\s*:#i', '', $value) ?? $value;
        $value = strip_tags(html_entity_decode($value, ENT_QUOTES | ENT_HTML5, 'UTF-8'));
        $value = preg_replace('/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/u', '', $value) ?? $value;

        return trim(mb_substr($value, 0, 4000));
    }
}
