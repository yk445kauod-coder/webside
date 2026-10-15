import { createClient } from "@/lib/supabase/server";
import type {
  PageRow,
  PublicationRow,
  RevisionRow,
  SiteRow,
  SubmissionRow,
} from "@/lib/types/database";

export interface DashboardSite {
  site: SiteRow;
  pages: PageRow[];
  latestSubmission: SubmissionRow | null;
  publications: PublicationRow[];
  revisions: RevisionRow[];
}

export async function getDashboardSites(
  ownerId: string,
): Promise<DashboardSite[]> {
  const supabase = await createClient();

  const { data: sites } = await supabase
    .from("sites")
    .select("*")
    .eq("owner_id", ownerId)
    .order("updated_at", { ascending: false });

  if (!sites) return [];

  const siteIds = sites.map((s) => s.id);

  const [{ data: pages }, { data: submissions }, { data: publications }, { data: revisions }] =
    await Promise.all([
      supabase.from("pages").select("*").in("site_id", siteIds),
      supabase.from("submissions").select("*").in("site_id", siteIds),
      supabase.from("publications").select("*").in("site_id", siteIds),
      supabase.from("revisions").select("*").in("site_id", siteIds),
    ]);

  return sites.map((site) => ({
    site,
    pages: pages?.filter((p) => p.site_id === site.id) ?? [],
    latestSubmission:
      submissions
        ?.filter((s) => s.site_id === site.id)
        .sort(
          (a, b) =>
            new Date(b.submitted_at).getTime() -
            new Date(a.submitted_at).getTime(),
        )[0] ?? null,
    publications:
      publications
        ?.filter((p) => p.site_id === site.id)
        .sort(
          (a, b) =>
            new Date(b.recorded_at).getTime() -
            new Date(a.recorded_at).getTime(),
        ) ?? [],
    revisions: revisions?.filter((r) => r.site_id === site.id) ?? [],
  }));
}