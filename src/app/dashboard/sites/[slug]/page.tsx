import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { SiteEditor } from "@/components/editor/site-editor";
import type {
  PublicationRow,
  RevisionRow,
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
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: site } = await supabase
    .from("sites")
    .select("*")
    .eq("slug", slug)
    .eq("owner_id", user.id)
    .single();

  if (!site) notFound();

  const [{ data: pages }, { data: submissions }, { data: revisions }, { data: publications }] =
    await Promise.all([
      supabase
        .from("pages")
        .select("*")
        .eq("site_id", site.id)
        .order("created_at", { ascending: true }),
      supabase
        .from("submissions")
        .select("*")
        .eq("site_id", site.id)
        .order("submitted_at", { ascending: false }),
      supabase
        .from("revisions")
        .select("*")
        .eq("site_id", site.id)
        .order("number", { ascending: false }),
      supabase
        .from("publications")
        .select("*")
        .eq("site_id", site.id)
        .order("recorded_at", { ascending: false }),
    ]);

  return (
    <SiteEditor
      site={site}
      pages={pages ?? []}
      submissions={(submissions as SubmissionRow[]) ?? []}
      revisions={(revisions as RevisionRow[]) ?? []}
      publications={(publications as PublicationRow[]) ?? []}
    />
  );
}