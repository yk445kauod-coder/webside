"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { uuidSchema } from "@/lib/schemas";
import type { SubmissionStatus } from "@/lib/types/database";

// NOTE: this is a "use server" module — every export is a public endpoint.
// Authorisation lives in Postgres: the RPCs below call `is_sudo()` and raise
// for anyone else, so a forged request can't act as the owner.

type ReviewResult = { ok: boolean; error?: string };

const notesSchema = z.string().trim().max(2000, "Keep notes under 2000 characters.");

function invalidId(): ReviewResult {
  return { ok: false, error: "Unknown submission." };
}

/** Move a submission to under_review. */
export async function takeSubmission(
  submissionId: string,
): Promise<ReviewResult> {
  if (!uuidSchema.safeParse(submissionId).success) return invalidId();
  const supabase = await createClient();

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
  if (!uuidSchema.safeParse(submissionId).success) return invalidId();
  if (decision !== "approved" && decision !== "rejected") {
    return { ok: false, error: "Unknown decision." };
  }
  const parsedNotes = notesSchema.safeParse(notes ?? "");
  if (!parsedNotes.success) {
    return { ok: false, error: parsedNotes.error.issues[0]?.message };
  }
  const supabase = await createClient();

  const { error } = await supabase.rpc("sudo_set_submission_status", {
    p_submission_id: submissionId,
    p_status: decision,
    p_owner_notes: parsedNotes.data || null,
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
  if (!uuidSchema.safeParse(submissionId).success) return invalidId();
  const supabase = await createClient();

  const parsed = parseUrl(url);
  if (!parsed) return { ok: false, error: "Enter a valid public URL (https://…)." };

  const { data: submission } = await supabase
    .from("submissions")
    .select("site_id")
    .eq("id", submissionId)
    .eq("status", "approved")
    .maybeSingle();

  if (!submission) {
    return { ok: false, error: "Only approved submissions can be published." };
  }

  const { error } = await supabase.rpc("sudo_record_publication", {
    p_site_id: submission.site_id,
    p_submission_id: submissionId,
    p_url: parsed,
    p_note: null,
  });
  if (error) {
    if (error.code === "23505") {
      return { ok: false, error: "That URL is already recorded for this site." };
    }
    return { ok: false, error: error.message };
  }

  revalidatePath("/sudo", "layout");
  return { ok: true };
}

/** A short-lived link to view the customer's transfer screenshot (SUDO only, via storage RLS). */
export async function getPaymentProofUrl(submissionId: string): Promise<ReviewResult & { url?: string }> {
  if (!uuidSchema.safeParse(submissionId).success) return invalidId();
  const supabase = await createClient();
  const { data } = await supabase.from("submissions").select("payment_proof_path").eq("id", submissionId).maybeSingle();
  if (!data?.payment_proof_path) return { ok: false, error: "No payment proof attached." };
  const signed = await supabase.storage.from("payment-proofs").createSignedUrl(data.payment_proof_path, 120);
  if (signed.error || !signed.data) return { ok: false, error: "Couldn't open the screenshot." };
  return { ok: true, url: signed.data.signedUrl };
}

/** Delete the screenshot file, then clear the reference. Done after verifying the payment. */
export async function deletePaymentProof(submissionId: string): Promise<ReviewResult> {
  if (!uuidSchema.safeParse(submissionId).success) return invalidId();
  const supabase = await createClient();
  const { data } = await supabase.from("submissions").select("payment_proof_path").eq("id", submissionId).maybeSingle();
  if (!data?.payment_proof_path) return { ok: false, error: "No payment proof attached." };
  const removed = await supabase.storage.from("payment-proofs").remove([data.payment_proof_path]);
  if (removed.error) return { ok: false, error: removed.error.message };
  const { error } = await supabase.rpc("sudo_clear_payment_proof", { p_submission_id: submissionId });
  if (error) return { ok: false, error: error.message };
  revalidatePath("/sudo", "layout");
  return { ok: true };
}

function parseUrl(input: string): string | null {
  const v = input.trim();
  if (!v || v.length > 2048) return null;
  try {
    const u = new URL(/^https?:\/\//i.test(v) ? v : `https://${v}`);
    if (!["http:", "https:"].includes(u.protocol)) return null;
    // A real public address has a dotted host; rejects "https://x" typos.
    if (!u.hostname.includes(".")) return null;
    return u.href;
  } catch {
    return null;
  }
}
