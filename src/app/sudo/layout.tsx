import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { SudoNav } from "@/components/site/sudo-nav";

// Reads cookies for the signed-in user.
export const instant = false;

export default async function SudoLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const {
    data: { isSudo },
  } = await supabase.rpc("is_sudo");
  if (isSudo !== true) {
    redirect("/dashboard?forbidden=sudo");
  }

  return (
    <div className="min-h-screen bg-canvas">
      <SudoNav displayName={user.email ?? "SUDO"} />
      <main className="mx-auto max-w-6xl px-6 py-10">{children}</main>
    </div>
  );
}