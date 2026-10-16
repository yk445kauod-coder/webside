import { createClient } from "@/lib/supabase/server";
import type {
  PublicationRow,
  SiteRow,
  SubmissionRow,
} from "@/lib/types/database";

export interface DashboardSite {
  site: SiteRow;
  pageCount: number;
  latestSubmission: SubmissionRow | null;
  latestPublication: PublicationRow | null;
}

/**
 * Everything the "My sites" grid needs — and nothing more. The previous
 * version downloaded every page's full block JSON and every revision snapshot
 * just to show a page count, which grows without bound as sites are edited.
 */
export async function getDashboardSites(
  ownerId: string,
): Promise<DashboardSite[]> {
  const supabase = await createClient();

  const { data: sites } = await supabase
    .from("sites")
    .select("*")
    .eq("owner_id", ownerId)
    .order("updated_at", { ascending: false });

  if (!sites?.length) return [];
  const siteIds = sites.map((s) => s.id);

  const [{ data: pages }, { data: submissions }, { data: publications }] =
    await Promise.all([
      supabase.from("pages").select("id, site_id").in("site_id", siteIds),
      supabase
        .from("submissions")
        .select("*")
        .in("site_id", siteIds)
        .order("submitted_at", { ascending: false }),
      supabase
        .from("publications")
        .select("*")
        .in("site_id", siteIds)
        .order("recorded_at", { ascending: false }),
    ]);

  const pageCount = new Map<string, number>();
  for (const p of pages ?? []) {
    pageCount.set(p.site_id, (pageCount.get(p.site_id) ?? 0) + 1);
  }
  // Rows arrive newest-first, so the first one seen per site is the latest.
  const latestSub = new Map<string, SubmissionRow>();
  for (const s of (submissions ?? []) as SubmissionRow[]) {
    if (!latestSub.has(s.site_id)) latestSub.set(s.site_id, s);
  }
  const latestPub = new Map<string, PublicationRow>();
  for (const p of (publications ?? []) as PublicationRow[]) {
    if (!latestPub.has(p.site_id)) latestPub.set(p.site_id, p);
  }

  return (sites as SiteRow[]).map((site) => ({
    site,
    pageCount: pageCount.get(site.id) ?? 0,
    latestSubmission: latestSub.get(site.id) ?? null,
    latestPublication: latestPub.get(site.id) ?? null,
  }));
}
