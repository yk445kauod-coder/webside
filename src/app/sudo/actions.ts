"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { SubmissionStatus } from "@/lib/types/database";

export async function isSudoUser(): Promise<boolean> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return false;
  const { data } = await supabase.rpc("is_sudo");
  return data === true;
}

export async function requireSudo(): Promise<boolean> {
  return isSudoUser();
}

type ReviewResult = { ok: boolean; error?: string };

/** Move a submission to under_review. */
export async function takeSubmission(
  submissionId: string,
): Promise<ReviewResult> {
  const supabase = await createClient();

  // SUDO can set an open submission to under_review via the RPC (RLS grants
  // the update through is_sudo, but we route through the definer for auditing).
  const { error } = await supabase.rpc("sudo_set_submission_status", {
    p_submission_id: submissionId,
    p_status: "under_review",
    p_owner_notes: null,
  });
  if (error) return { ok: false, error: error.message };

  revalidatePath("/sudo", "layout");
  return { ok: true };
}

/** Approve or reject an immutable revision + submission. Audited via RPC. */
export async function reviewSubmission(
  submissionId: string,
  decision: Extract<SubmissionStatus, "approved" | "rejected">,
  notes?: string,
): Promise<ReviewResult> {
  const supabase = await createClient();

  const { error } = await supabase.rpc("sudo_set_submission_status", {
    p_submission_id: submissionId,
    p_status: decision,
    p_owner_notes: notes?.trim() || null,
  });
  if (error) return { ok: false, error: error.message };

  revalidatePath("/sudo", "layout");
  return { ok: true };
}

/** Record the verified public URL for an approved submission. Audited via RPC. */
export async function recordPublication(
  submissionId: string,
  url: string,
): Promise<ReviewResult> {
  const supabase = await createClient();

  const parsed = parseUrl(url);
  if (!parsed) return { ok: false, error: "Enter a valid public URL (https://…)." };

  const { data: submission } = await supabase
    .from("submissions")
    .select("site_id")
    .eq("id", submissionId)
    .eq("status", "approved")
    .single();

  if (!submission) return { ok: false, error: "Only approved submissions can be published." };

  const { error } = await supabase.rpc("sudo_record_publication", {
    p_site_id: submission.site_id,
    p_submission_id: submissionId,
    p_url: parsed,
    p_note: null,
  });
  if (error) return { ok: false, error: error.message };

  revalidatePath("/sudo", "layout");
  return { ok: true };
}

function parseUrl(input: string): string | null {
  const v = input.trim();
  if (!v) return null;
  try {
    const u = new URL(v.startsWith("http") ? v : `https://${v}`);
    if (!["http:", "https:"].includes(u.protocol)) return null;
    return u.href;
  } catch {
    return null;
  }
}