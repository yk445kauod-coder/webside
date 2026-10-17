import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getSessionUser, isSudoUser } from "@/lib/auth";
import { DashboardNav } from "@/components/site/dashboard-nav";

// Reads cookies for the signed-in user + navigation.

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getSessionUser();
  if (!user) redirect("/login");

  const supabase = await createClient();
  const [{ data: profile }, sudo] = await Promise.all([
    supabase.from("profiles").select("display_name").eq("id", user.id).maybeSingle(),
    isSudoUser(),
  ]);

  const displayName = profile?.display_name || user.email?.split("@")[0] || "you";

  return (
    <div className="min-h-screen bg-canvas">
      <DashboardNav displayName={displayName} isSudo={sudo} />
      <main id="main" className="mx-auto max-w-5xl px-4 py-8 sm:px-6 sm:py-10">
        {children}
      </main>
    </div>
  );
}
