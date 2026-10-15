"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import {
  canonicalJson,
  type AnyBlock,
  type SiteSnapshot,
} from "@/lib/types/blocks";

export type ActionResult = { ok: boolean; error?: string };

/** Persist a page's blocks (autosave / Save). */
export async function savePageBlocks(
  pageId: string,
  blocks: AnyBlock[],
): Promise<ActionResult> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("pages")
    .update({ blocks })
    .eq("id", pageId);
  if (error) return { ok: false, error: error.message };
  revalidatePath("/dashboard/sites", "layout");
  return { ok: true };
}

/**
 * Freeze the whole site as an immutable revision.
 * The snapshot is read from the database (source of truth), so the recorded
 * version is always exact and verifiable.
 */
export async function createRevision(
  siteId: string,
  label?: string,
): Promise<ActionResult & { revisionNumber?: number }> {
  const supabase = await createClient();

  const { data: pages, error: pagesError } = await supabase
    .from("pages")
    .select("*")
    .eq("site_id", siteId);
  if (pagesError) return { ok: false, error: pagesError.message };
  if (!pages?.length) return { ok: false, error: "Site has no pages yet." };

  const snapshot: SiteSnapshot = {};
  for (const p of pages) {
    snapshot[p.key] = { title: p.title, path: p.path, blocks: p.blocks };
  }
  const contentHash = await sha256(canonicalJson(snapshot));

  const { data: maxRow } = await supabase
    .from("revisions")
    .select("number")
    .eq("site_id", siteId)
    .order("number", { ascending: false })
    .limit(1)
    .single();

  const number = (maxRow?.number ?? 0) + 1;

  const { error: revError } = await supabase.from("revisions").insert({
    site_id: siteId,
    number,
    pages: snapshot,
    content_hash: contentHash,
    label: label || `Version ${number}`,
  });
  if (revError) return { ok: false, error: revError.message };

  revalidatePath("/dashboard/sites", "layout");
  return { ok: true, revisionNumber: number };
}

/**
 * Submit the site for owner review. Saves a fresh immutable revision of the
 * exact current pages, then opens a submission against that revision.
 */
export async function submitForReview(
  siteId: string,
  note?: string,
): Promise<ActionResult & { revisionNumber?: number; submissionId?: string }> {
  const supabase = await createClient();

  // 1. Immutable snapshot from source of truth
  const { data: pages, error: pagesError } = await supabase
    .from("pages")
    .select("*")
    .eq("site_id", siteId);
  if (pagesError) return { ok: false, error: pagesError.message };
  if (!pages?.length) return { ok: false, error: "Site has no pages yet." };

  const snapshot: SiteSnapshot = {};
  for (const p of pages) {
    snapshot[p.key] = { title: p.title, path: p.path, blocks: p.blocks };
  }
  const contentHash = await sha256(canonicalJson(snapshot));

  const { data: maxRow } = await supabase
    .from("revisions")
    .select("number")
    .eq("site_id", siteId)
    .order("number", { ascending: false })
    .limit(1)
    .single();
  const number = (maxRow?.number ?? 0) + 1;

  const { data: revision, error: revError } = await supabase
    .from("revisions")
    .insert({
      site_id: siteId,
      number,
      pages: snapshot,
      content_hash: contentHash,
      label: `Submitted ${new Date().toLocaleString()}`,
    })
    .select()
    .single();
  if (revError) return { ok: false, error: revError.message };

  // 2. Submission (the open-once constraint protects against duplicates)
  const { data: submission, error: subError } = await supabase
    .from("submissions")
    .insert({ site_id: siteId, revision_id: revision.id, note: note || null })
    .select()
    .single();

  if (subError) {
    if (subError.message.includes("open submission already exists")) {
      return {
        ok: false,
        error:
          "You already have a submission in review. Wait for it to be resolved.",
      };
    }
    return { ok: false, error: subError.message };
  }

  revalidatePath("/dashboard/sites", "layout");
  return { ok: true, revisionNumber: number, submissionId: submission.id };
}

// ---------------------------------------------------------------------------
// SHA-256 via Web Crypto (server-compatible).
// ---------------------------------------------------------------------------
async function sha256(input: string): Promise<string> {
  const buf = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(input),
  );
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}