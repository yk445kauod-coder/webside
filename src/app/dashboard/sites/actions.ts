"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getSessionUser } from "@/lib/auth";
import { LIMITS } from "@/lib/limits";
import {
  noteSchema,
  pageTitleSchema,
  parseBlocks,
  uuidSchema,
} from "@/lib/schemas";
import { slugify } from "@/lib/utils";
import {
  canonicalJson,
  type AnyBlock,
  type SiteSnapshot,
} from "@/lib/types/blocks";
import type { PageRow, RevisionRow } from "@/lib/types/database";

export type ActionResult = { ok: boolean; error?: string };

type Supabase = Awaited<ReturnType<typeof createClient>>;

const MAX_PAGES_PER_SITE = LIMITS.pagesPerSite;
const NOT_SIGNED_IN = "You need to sign in again.";

function refreshDashboard() {
  revalidatePath("/dashboard", "layout");
}

// ---------------------------------------------------------------------------
// Pages
// ---------------------------------------------------------------------------

/** Persist a page's blocks (autosave). Validated and sanitised server-side. */
export async function savePageBlocks(
  pageId: string,
  blocks: AnyBlock[],
): Promise<ActionResult & { savedAt?: string }> {
  if (!uuidSchema.safeParse(pageId).success) {
    return { ok: false, error: "Unknown page." };
  }
  const parsed = parseBlocks(blocks);
  if (!parsed.ok) return { ok: false, error: parsed.error };

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("pages")
    .update({ blocks: parsed.blocks })
    .eq("id", pageId)
    .select("id, site_id");
  if (error) return { ok: false, error: error.message };
  // RLS hides pages the user doesn't own, which surfaces as zero rows.
  if (!data?.length) {
    return { ok: false, error: "Page not found, or you no longer have access." };
  }

  // Keep "last saved" on the dashboard honest.
  const savedAt = new Date().toISOString();
  await supabase.from("sites").update({ updated_at: savedAt }).eq("id", data[0].site_id);

  return { ok: true, savedAt };
}

/** Add a page to a site. The page is persisted immediately. */
export async function createPage(
  siteId: string,
  rawTitle: string,
): Promise<ActionResult & { page?: PageRow }> {
  if (!uuidSchema.safeParse(siteId).success) {
    return { ok: false, error: "Unknown site." };
  }
  const title = pageTitleSchema.safeParse(rawTitle);
  if (!title.success) {
    return { ok: false, error: title.error.issues[0]?.message ?? "Invalid title." };
  }

  const supabase = await createClient();
  const { data: existing, error: listError } = await supabase
    .from("pages")
    .select("key, path")
    .eq("site_id", siteId);
  if (listError) return { ok: false, error: listError.message };
  if ((existing?.length ?? 0) >= MAX_PAGES_PER_SITE) {
    return {
      ok: false,
      error: `A site can have up to ${MAX_PAGES_PER_SITE} pages.`,
    };
  }

  // Non-latin titles slugify to nothing, so fall back to a short random id.
  const base = slugify(title.data) || `page-${Math.random().toString(36).slice(2, 6)}`;
  const keys = new Set((existing ?? []).map((p) => p.key as string));
  const paths = new Set((existing ?? []).map((p) => p.path as string));
  let slug = base;
  for (let n = 2; keys.has(`page-${slug}`) || paths.has(`/${slug}`); n++) {
    slug = `${base}-${n}`;
  }

  const { data: page, error } = await supabase
    .from("pages")
    .insert({
      site_id: siteId,
      key: `page-${slug}`,
      title: title.data,
      path: `/${slug}`,
      blocks: [],
    })
    .select()
    .single();
  if (error) return { ok: false, error: error.message };

  return { ok: true, page: page as PageRow };
}

/** Remove a page. The home page and a site's last page are protected. */
export async function deletePage(pageId: string): Promise<ActionResult> {
  if (!uuidSchema.safeParse(pageId).success) {
    return { ok: false, error: "Unknown page." };
  }
  const supabase = await createClient();

  const { data: page } = await supabase
    .from("pages")
    .select("id, site_id, path")
    .eq("id", pageId)
    .maybeSingle();
  if (!page) return { ok: false, error: "Page not found." };
  if (page.path === "/") {
    return { ok: false, error: "The home page can't be deleted." };
  }

  const { error } = await supabase.from("pages").delete().eq("id", pageId);
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

// ---------------------------------------------------------------------------
// Revisions + submissions
// ---------------------------------------------------------------------------

/**
 * Freeze the whole site as an immutable revision.
 * The snapshot is read from the database (source of truth), so the recorded
 * version is always exact and verifiable. If nothing changed since the latest
 * version, no duplicate is created.
 */
export async function createRevision(
  siteId: string,
  label?: string,
): Promise<ActionResult & { revisionNumber?: number; unchanged?: boolean }> {
  if (!uuidSchema.safeParse(siteId).success) {
    return { ok: false, error: "Unknown site." };
  }
  const user = await getSessionUser();
  if (!user) return { ok: false, error: NOT_SIGNED_IN };

  const supabase = await createClient();
  const built = await buildSnapshot(supabase, siteId);
  if ("error" in built) return { ok: false, error: built.error };

  const latest = await latestRevision(supabase, siteId);
  if (latest && latest.content_hash === built.hash) {
    return { ok: true, revisionNumber: latest.number, unchanged: true };
  }

  const inserted = await insertRevision(supabase, user.id, siteId, built, label);
  if ("error" in inserted) return { ok: false, error: inserted.error };

  refreshDashboard();
  return { ok: true, revisionNumber: inserted.revision.number };
}

/**
 * Submit the site for owner review. Freezes the exact current pages as a
 * revision (re-using an identical, never-submitted one) and opens a
 * submission against it.
 */
export async function submitForReview(
  siteId: string,
  note?: string,
  proofPath?: string,
): Promise<ActionResult & { revisionNumber?: number; submissionId?: string }> {
  if (!uuidSchema.safeParse(siteId).success) {
    return { ok: false, error: "Unknown site." };
  }
  const parsedNote = noteSchema.safeParse(note ?? "");
  if (!parsedNote.success) {
    return { ok: false, error: parsedNote.error.issues[0]?.message ?? "Invalid note." };
  }
  const user = await getSessionUser();
  if (!user) return { ok: false, error: NOT_SIGNED_IN };

  const supabase = await createClient();

  // Payment proof: required for a site's first publication; the path must be inside the caller's own folder.
  if (proofPath !== undefined && !isOwnProofPath(proofPath, user.id)) {
    return { ok: false, error: "Invalid payment proof." };
  }
  if (!proofPath && (await needsPaymentProof(supabase, siteId))) {
    return { ok: false, error: "Attach your InstaPay transfer screenshot to publish for the first time." };
  }

  // 1. Fail fast — before any revision is written — if one is already open.
  const { data: open } = await supabase
    .from("submissions")
    .select("id")
    .eq("site_id", siteId)
    .in("status", ["submitted", "under_review"])
    .limit(1);
  if (open?.length) return { ok: false, error: OPEN_SUBMISSION_ERROR };

  // 2. Exact snapshot from the source of truth.
  const built = await buildSnapshot(supabase, siteId);
  if ("error" in built) return { ok: false, error: built.error };

  // 3. Reuse an identical revision that was never submitted; refuse to
  //    resubmit content that was already reviewed.
  const { data: same } = await supabase
    .from("revisions")
    .select("id, number")
    .eq("site_id", siteId)
    .eq("content_hash", built.hash)
    .order("number", { ascending: false })
    .limit(1)
    .maybeSingle();

  let revisionId: string;
  let revisionNumber: number;
  if (same) {
    const { data: used } = await supabase
      .from("submissions")
      .select("id")
      .eq("revision_id", same.id)
      .limit(1);
    if (used?.length) {
      return {
        ok: false,
        error: `Nothing has changed since version ${same.number} was reviewed. Make a change, then submit again.`,
      };
    }
    revisionId = same.id;
    revisionNumber = same.number;
  } else {
    const inserted = await insertRevision(
      supabase,
      user.id,
      siteId,
      built,
      undefined,
      "Submitted",
    );
    if ("error" in inserted) return { ok: false, error: inserted.error };
    revisionId = inserted.revision.id;
    revisionNumber = inserted.revision.number;
  }

  // 4. Submission (the open-once trigger still guards against races).
  const { data: submission, error } = await supabase
    .from("submissions")
    .insert({
      site_id: siteId,
      revision_id: revisionId,
      note: parsedNote.data || null,
      payment_proof_path: proofPath || null,
    })
    .select()
    .single();
  if (error) {
    if (error.message.includes("open submission already exists")) {
      return { ok: false, error: OPEN_SUBMISSION_ERROR };
    }
    return { ok: false, error: error.message };
  }

  refreshDashboard();
  return { ok: true, revisionNumber, submissionId: submission.id };
}

/** What the publish dialog needs: whether a transfer screenshot is required, and where to pay. */
export async function getPaymentInfo(
  siteId: string,
): Promise<{ needsProof: boolean; instapay: string }> {
  if (!uuidSchema.safeParse(siteId).success) return { needsProof: false, instapay: "" };
  const supabase = await createClient();
  const [needsProof, { data: setting }] = await Promise.all([
    needsPaymentProof(supabase, siteId),
    supabase.from("settings").select("value").eq("key", "instapay_link").eq("is_public", true).maybeSingle(),
  ]);
  const v = setting?.value;
  return { needsProof, instapay: typeof v === "string" ? v.slice(0, 300) : "" };
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function isOwnProofPath(path: string, userId: string): boolean {
  return path.startsWith(`${userId}/`) && /^[0-9a-f-]{36}\/[A-Za-z0-9._-]{1,80}$/.test(path);
}

/** First publication = the site has never been published, so a payment screenshot is required. */
async function needsPaymentProof(supabase: Supabase, siteId: string): Promise<boolean> {
  const { count } = await supabase
    .from("publications")
    .select("id", { count: "exact", head: true })
    .eq("site_id", siteId);
  return (count ?? 0) === 0;
}

const OPEN_SUBMISSION_ERROR =
  "You already have a submission in review. Wait for it to be resolved.";

type Built = { snapshot: SiteSnapshot; hash: string };

async function buildSnapshot(
  supabase: Supabase,
  siteId: string,
): Promise<Built | { error: string }> {
  const { data: pages, error } = await supabase
    .from("pages")
    .select("key, title, path, blocks")
    .eq("site_id", siteId)
    .order("created_at", { ascending: true });
  if (error) return { error: error.message };
  if (!pages?.length) return { error: "Site has no pages yet." };

  const snapshot: SiteSnapshot = {};
  for (const p of pages) {
    snapshot[p.key] = { title: p.title, path: p.path, blocks: p.blocks };
  }
  return { snapshot, hash: await sha256(canonicalJson(snapshot)) };
}

async function latestRevision(supabase: Supabase, siteId: string) {
  const { data } = await supabase
    .from("revisions")
    .select("number, content_hash")
    .eq("site_id", siteId)
    .order("number", { ascending: false })
    .limit(1)
    .maybeSingle();
  return (data as Pick<RevisionRow, "number" | "content_hash"> | null) ?? null;
}

/** Insert the next revision number, retrying if two saves race for it. */
async function insertRevision(
  supabase: Supabase,
  userId: string,
  siteId: string,
  built: Built,
  label?: string,
  labelPrefix?: string,
): Promise<{ revision: RevisionRow } | { error: string }> {
  for (let attempt = 0; attempt < 3; attempt++) {
    const latest = await latestRevision(supabase, siteId);
    const number = (latest?.number ?? 0) + 1;
    const { data, error } = await supabase
      .from("revisions")
      .insert({
        site_id: siteId,
        number,
        pages: built.snapshot,
        content_hash: built.hash,
        label: label || `${labelPrefix ?? "Version"} ${number}`,
        created_by: userId,
      })
      .select()
      .single();
    if (!error) return { revision: data as RevisionRow };
    // 23505 = (site_id, number) already taken by a concurrent save: retry.
    if (error.code !== "23505") return { error: error.message };
  }
  return { error: "Couldn't save a new version — please try again." };
}

// SHA-256 via Web Crypto (server-compatible).
async function sha256(input: string): Promise<string> {
  const buf = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(input),
  );
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}
