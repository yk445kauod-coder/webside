import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { DashboardNav } from "@/components/site/dashboard-nav";

// Reads cookies for the signed-in user + navigation.
export const instant = false;

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  const displayName = profile?.display_name || user.email?.split("@")[0] || "you";

  return (
    <div className="min-h-screen bg-canvas">
      <DashboardNav displayName={displayName} />
      <main className="mx-auto max-w-5xl px-6 py-10">{children}</main>
    </div>
  );
}