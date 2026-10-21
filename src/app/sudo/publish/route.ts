import { revalidatePath } from "next/cache";
import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { uuidSchema } from "@/lib/schemas";
import { commitSite } from "@/lib/publish/github";
import { renderSite } from "@/lib/publish/render";
import { validatePublishSlug } from "@/lib/publish/slug";
import type { SiteSnapshot } from "@/lib/types/blocks";

// A route handler (not a server action) because rendering uses react-dom/server, which Next only
// allows outside the server-component/action layer. Authorisation is unchanged: every read is
// RLS-limited to SUDO and the final RPC re-checks is_sudo() in Postgres.

const fail = (error: string, status = 400) => NextResponse.json({ ok: false, error }, { status });

/**
 * Render an approved revision to static HTML, commit it to sites/<slug>/ in the repo and
 * record the public URL. The deploy workflow ships the commit (a few minutes).
 */
export async function POST(request: NextRequest) {
  // Cookie-authenticated POST: only accept same-origin requests.
  const origin = request.headers.get("origin");
  if (!origin || new URL(origin).host !== request.headers.get("host")) return fail("Forbidden.", 403);

  let submissionId: unknown;
  try {
    submissionId = ((await request.json()) as { submissionId?: unknown }).submissionId;
  } catch {
    return fail("Bad request.");
  }
  if (!uuidSchema.safeParse(submissionId).success) return fail("Unknown submission.");

  const supabase = await createClient();
  const { data: sub } = await supabase
    .from("submissions")
    .select("site_id, revision_id, status")
    .eq("id", submissionId as string)
    .maybeSingle();
  if (!sub || sub.status !== "approved") return fail("Only approved submissions can be published.");

  const [{ data: site }, { data: rev }] = await Promise.all([
    supabase.from("sites").select("name, slug").eq("id", sub.site_id).maybeSingle(),
    supabase.from("revisions").select("pages").eq("id", sub.revision_id).maybeSingle(),
  ]);
  if (!site || !rev) return fail("Unknown submission.");

  const slugError = validatePublishSlug(site.slug);
  if (slugError) return fail(slugError);

  const rendered = renderSite(site.slug, site.name, rev.pages as SiteSnapshot);
  if ("error" in rendered) return fail(rendered.error);

  const committed = await commitSite(site.slug, rendered.files, `publish: ${site.slug}`);
  if (!committed.ok) return fail(committed.error, 502);

  const base = (process.env.PUBLIC_SITES_ORIGIN || "https://web-side.pages.dev").replace(/\/+$/, "");
  const url = `${base}/${site.slug}/`;
  const { error } = await supabase.rpc("sudo_record_publication", {
    p_site_id: sub.site_id,
    p_submission_id: submissionId as string,
    p_url: url,
    p_note: `commit ${committed.commit.slice(0, 7)}`,
  });
  // 23505: this exact URL was recorded by an earlier publish; the new commit still went out.
  if (error && error.code !== "23505") return fail(error.message, error.message === "Not authorized" ? 403 : 400);

  revalidatePath("/sudo", "layout");
  return NextResponse.json({ ok: true, url });
}
