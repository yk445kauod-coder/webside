import { createClient } from "@/lib/supabase/server";
import type {
  PageRow,
  Profile,
  PublicationRow,
  RevisionRow,
  SiteRow,
  SubmissionRow,
} from "@/lib/types/database";

export interface SudoQueueItem {
  site: SiteRow;
  owner: Profile | null;
  pages: PageRow[];
  revision: RevisionRow;
  submission: SubmissionRow;
  publications: PublicationRow[];
}

/** Everything SUDO needs for the review queue: open + resolved submissions. */
export async function getSudoQueue(): Promise<{
  open: SudoQueueItem[];
  resolved: SudoQueueItem[];
  totals: { sites: number; customers: number; approved: number };
}> {
  const supabase = await createClient();

  const [{ data: sites }, { data: submissions }, { data: revisions }, { data: publications }, { data: pages }, { data: profiles }] =
    await Promise.all([
      supabase.from("sites").select("*").order("created_at", { ascending: false }),
      supabase.from("submissions").select("*").order("submitted_at", { ascending: false }),
      supabase.from("revisions").select("*"),
      supabase.from("publications").select("*").order("recorded_at", { ascending: false }),
      supabase.from("pages").select("*"),
      supabase.from("profiles").select("*"),
    ]);

  const siteById = new Map((sites ?? []).map((s) => [s.id, s as SiteRow]));
  const revById = new Map((revisions ?? []).map((r) => [r.id, r as RevisionRow]));
  const profById = new Map((profiles ?? []).map((p) => [p.id, p as Profile]));
  const pagesBySite = new Map<string, PageRow[]>();
  for (const p of pages ?? []) {
    const arr = pagesBySite.get(p.site_id) ?? [];
    arr.push(p as PageRow);
    pagesBySite.set(p.site_id, arr);
  }
  const pubsBySite = new Map<string, PublicationRow[]>();
  for (const p of publications ?? []) {
    const arr = pubsBySite.get(p.site_id) ?? [];
    arr.push(p as PublicationRow);
    pubsBySite.set(p.site_id, arr);
  }

  const toItem = (sub: SubmissionRow): SudoQueueItem | null => {
    const site = siteById.get(sub.site_id);
    const revision = revById.get(sub.revision_id);
    if (!site || !revision) return null;
    return {
      site,
      owner: profById.get(site.owner_id) ?? null,
      pages: pagesBySite.get(site.id) ?? [],
      revision,
      submission: sub,
      publications: pubsBySite.get(site.id) ?? [],
    };
  };

  const open: SudoQueueItem[] = [];
  const resolved: SudoQueueItem[] = [];
  for (const s of submissions ?? []) {
    const item = toItem(s as SubmissionRow);
    if (!item) continue;
    if (s.status === "submitted" || s.status === "under_review") open.push(item);
    else resolved.push(item);
  }

  const approved = (submissions ?? []).filter((s) => s.status === "approved").length;

  return {
    open,
    resolved,
    totals: {
      sites: sites?.length ?? 0,
      customers: new Set((sites ?? []).map((s) => s.owner_id)).size,
      approved,
    },
  };
}

/** Recent audit trail, newest first. */
export async function getAuditLogs(limit = 50) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("audit_logs")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(limit);
  return (data ?? []) as Array<{
    id: number;
    actor_id: string | null;
    actor_role: string | null;
    action: string;
    entity: string | null;
    entity_id: string | null;
    metadata: Record<string, unknown>;
    created_at: string;
  }>;
}