import { redirect } from "next/navigation";
import { getSessionUser, isSudoUser } from "@/lib/auth";
import { SudoNav } from "@/components/site/sudo-nav";

// Reads cookies for the signed-in user.

export default async function SudoLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getSessionUser();
  if (!user) redirect("/login");

  // `rpc("is_sudo")` resolves to `{ data: boolean }`. The previous code
  // destructured `data: { isSudo }` from that boolean, which is always
  // undefined — so every admin was bounced back to the dashboard.
  if (!(await isSudoUser())) {
    redirect("/dashboard?forbidden=sudo");
  }

  return (
    <div className="min-h-screen bg-canvas">
      <SudoNav displayName={user.email ?? "SUDO"} />
      <main id="main" className="mx-auto max-w-6xl px-6 py-10">
        {children}
      </main>
    </div>
  );
}
