<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use App\Models\ActivityLog;
use App\Models\AuditTrail;
use App\Models\LegalDocument;
use App\Support\Audit\RequestContext;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * Legal pages CMS (privacy policy, terms, refund policy, contact, copyright).
 *
 * Public endpoints serve published documents only. Owner & admin edit them
 * from the CMS hub; every save is sanitized, stamped with the editor, and
 * recorded in the existing audit trail. Saving refreshes updated_at, which is
 * what the public "Terakhir diperbarui" label renders — no redeploy needed.
 */
final class LegalController extends Controller
{
    // ----------------------------- Public -----------------------------

    /** All published legal documents (slug + title + updated_at only). */
    public function index(): JsonResponse
    {
        $docs = LegalDocument::query()->published()
            ->orderBy('id')
            ->get(['slug', 'title', 'meta_description', 'updated_at']);

        return response()->json(['success' => true, 'message' => 'Dokumen legal.', 'data' => $docs]);
    }

    /** One published legal document by slug. */
    public function show(string $slug): JsonResponse
    {
        $doc = LegalDocument::query()->published()->where('slug', $slug)
            ->firstOrFail(['slug', 'title', 'meta_description', 'body', 'updated_at']);

        return response()->json(['success' => true, 'message' => 'Dokumen legal.', 'data' => $doc]);
    }

    // ------------------------- Admin & owner --------------------------

    /** Full list for the CMS editor, including unpublished drafts. */
    public function adminIndex(): JsonResponse
    {
        $docs = LegalDocument::query()->with('updatedBy:id,name')->orderBy('id')->get();

        return response()->json(['data' => $docs]);
    }

    public function adminShow(string $slug): JsonResponse
    {
        return response()->json(['data' => LegalDocument::where('slug', $slug)->firstOrFail()]);
    }

    /**
     * Update (or create, for a slug that was never seeded) a legal document.
     * Body is sanitized before storage so nothing executable can ever reach a
     * reader, even if an editor account is compromised.
     */
    public function adminUpdate(Request $request, string $slug): JsonResponse
    {
        abort_unless(in_array($slug, LegalDocument::SLUGS, true), 404);

        $data = $request->validate([
            'title' => 'sometimes|string|max:200',
            'meta_description' => 'sometimes|nullable|string|max:300',
            'body' => 'sometimes|string|max:60000',
            'is_published' => 'sometimes|boolean',
        ]);

        if (isset($data['body'])) {
            $data['body'] = $this->sanitize($data['body']);
        }
        if (isset($data['meta_description'])) {
            $data['meta_description'] = $this->sanitize((string) $data['meta_description']);
        }
        if (isset($data['title'])) {
            $data['title'] = $this->sanitize($data['title']);
        }

        $doc = LegalDocument::firstOrNew(['slug' => $slug]);
        $before = $doc->exists ? $doc->only(array_keys($data)) : null;

        $doc->fill($data);
        $doc->title = $doc->title ?: ucwords(str_replace('-', ' ', $slug));
        $doc->body = $doc->body ?? '';
        $doc->updated_by = $request->user()?->id;
        // Force a timestamp bump even when the payload is identical, so the
        // public "Terakhir diperbarui" date always reflects the last review.
        $doc->updated_at = now();
        $doc->save();

        $this->audit($request, 'legal.document_updated', ['slug' => $slug, 'before' => $before]);

        return response()->json(['data' => $doc->fresh()]);
    }

    /**
     * Strip anything executable or renderable as markup.
     *
     * Content is authored as markdown-lite (## headings, - bullets, blank-line
     * separated paragraphs) and the frontend renders it as React elements
     * rather than HTML, so this is the second of two independent XSS defenses.
     */
    private function sanitize(string $value): string
    {
        // Remove script/style blocks wholesale (including their contents).
        $value = preg_replace('#<(script|style|iframe|object|embed)\b[^>]*>.*?</\1>#is', '', $value) ?? $value;
        // Drop any remaining tags.
        $value = strip_tags($value);
        // Neutralise javascript:/data: URLs that survive as plain text.
        $value = preg_replace('#\b(javascript|vbscript|data)\s*:#i', '', $value) ?? $value;
        // Decode entities so "&lt;script&gt;" can't be re-encoded downstream,
        // then strip once more in case decoding revealed markup.
        $value = strip_tags(html_entity_decode($value, ENT_QUOTES | ENT_HTML5, 'UTF-8'));
        // Strip control characters except tab/newline/carriage return.
        $value = preg_replace('/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/u', '', $value) ?? $value;

        return trim($value);
    }

    /** @param array<string, mixed> $meta */
    private function audit(Request $request, string $action, array $meta): void
    {
        $meta = RequestContext::enrich($request, $meta);
        AuditTrail::record($action, 'LegalDocument', 'user', (string) $request->user()?->id, $meta);
        ActivityLog::create([
            'action' => $action,
            'subject_type' => 'LegalDocument',
            'subject_id' => null,
            'metadata' => $meta,
        ]);
    }
}
