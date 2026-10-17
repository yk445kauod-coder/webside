import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getSessionUser } from "@/lib/auth";
import { SiteEditor } from "@/components/editor/site-editor";
import type {
  PageRow,
  PublicationRow,
  RevisionRow,
  SiteRow,
  SubmissionRow,
} from "@/lib/types/database";

// Reads cookies for the signed-in user.
export const instant = false;

export const metadata: Metadata = { title: "Editor" };

export default async function EditorPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const user = await getSessionUser();
  if (!user) redirect("/login");

  const supabase = await createClient();
  const { data: site } = await supabase
    .from("sites")
    .select("*")
    .eq("slug", slug)
    .eq("owner_id", user.id)
    .maybeSingle();

  if (!site) notFound();

  const [{ data: pages }, { data: submissions }, { data: revisions }, { data: publications }] =
    await Promise.all([
      supabase.from("pages").select("*").eq("site_id", site.id).order("created_at", { ascending: true }),
      supabase.from("submissions").select("*").eq("site_id", site.id).order("submitted_at", { ascending: false }),
      // The editor only lists versions; it never needs their full snapshots.
      supabase
        .from("revisions")
        .select("id, site_id, number, content_hash, label, created_by, created_at")
        .eq("site_id", site.id)
        .order("number", { ascending: false }),
      supabase.from("publications").select("*").eq("site_id", site.id).order("recorded_at", { ascending: false }),
    ]);

  return (
    <SiteEditor
      // Remount if the user navigates between two different sites.
      key={site.id}
      site={site as SiteRow}
      pages={(pages ?? []) as PageRow[]}
      submissions={(submissions ?? []) as SubmissionRow[]}
      revisions={(revisions ?? []) as unknown as RevisionRow[]}
      publications={(publications ?? []) as PublicationRow[]}
    />
  );
}
