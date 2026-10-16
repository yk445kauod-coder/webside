import { createClient } from "@/lib/supabase/server";
import { isOpenStatus } from "@/lib/submission-status";
import type {
  AuditLogRow,
  Profile,
  PublicationRow,
  RevisionRow,
  SiteRow,
  SubmissionRow,
} from "@/lib/types/database";

export interface SudoQueueItem {
  site: SiteRow;
  owner: Profile | null;
  revision: RevisionRow;
  submission: SubmissionRow;
  publications: PublicationRow[];
}

/** How many resolved submissions the history list loads. */
const HISTORY_LIMIT = 100;

/** Everything SUDO needs for the review queue: open + resolved submissions. */
export async function getSudoQueue(): Promise<{
  open: SudoQueueItem[];
  resolved: SudoQueueItem[];
  totals: { sites: number; customers: number; approved: number };
}> {
  const supabase = await createClient();

  const [
    { data: sites },
    { data: openSubs },
    { data: resolvedSubs },
    { data: publications },
    { count: approved },
  ] = await Promise.all([
    supabase.from("sites").select("*").order("created_at", { ascending: false }),
    supabase
      .from("submissions")
      .select("*")
      .in("status", ["submitted", "under_review"])
      .order("submitted_at", { ascending: true }), // oldest waiting first
    supabase
      .from("submissions")
      .select("*")
      .in("status", ["approved", "rejected"])
      .order("submitted_at", { ascending: false })
      .limit(HISTORY_LIMIT),
    supabase.from("publications").select("*").order("recorded_at", { ascending: false }),
    supabase
      .from("submissions")
      .select("id", { count: "exact", head: true })
      .eq("status", "approved"),
  ]);

  const submissions = [...(openSubs ?? []), ...(resolvedSubs ?? [])] as SubmissionRow[];
  const siteRows = (sites ?? []) as SiteRow[];
  const siteById = new Map(siteRows.map((s) => [s.id, s]));

  // Only fetch the revisions and owners that are actually on screen, instead
  // of every revision snapshot and every profile in the database.
  const revisionIds = [...new Set(submissions.map((s) => s.revision_id))];
  const ownerIds = [...new Set(siteRows.map((s) => s.owner_id))];
  const [{ data: revisions }, { data: profiles }] = await Promise.all([
    revisionIds.length
      ? supabase.from("revisions").select("*").in("id", revisionIds)
      : Promise.resolve({ data: [] as RevisionRow[] }),
    ownerIds.length
      ? supabase.from("profiles").select("*").in("id", ownerIds)
      : Promise.resolve({ data: [] as Profile[] }),
  ]);

  const revById = new Map(((revisions ?? []) as RevisionRow[]).map((r) => [r.id, r]));
  const profById = new Map(((profiles ?? []) as Profile[]).map((p) => [p.id, p]));
  const pubsBySite = new Map<string, PublicationRow[]>();
  for (const p of (publications ?? []) as PublicationRow[]) {
    const arr = pubsBySite.get(p.site_id) ?? [];
    arr.push(p);
    pubsBySite.set(p.site_id, arr);
  }

  const open: SudoQueueItem[] = [];
  const resolved: SudoQueueItem[] = [];
  for (const submission of submissions) {
    const site = siteById.get(submission.site_id);
    const revision = revById.get(submission.revision_id);
    if (!site || !revision) continue;
    const item: SudoQueueItem = {
      site,
      owner: profById.get(site.owner_id) ?? null,
      revision,
      submission,
      publications: pubsBySite.get(site.id) ?? [],
    };
    (isOpenStatus(submission.status) ? open : resolved).push(item);
  }

  return {
    open,
    resolved,
    totals: {
      sites: siteRows.length,
      customers: ownerIds.length,
      approved: approved ?? 0,
    },
  };
}

/** Recent audit trail, newest first. */
export async function getAuditLogs(limit = 50): Promise<AuditLogRow[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("audit_logs")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(limit);
  return (data ?? []) as AuditLogRow[];
}
