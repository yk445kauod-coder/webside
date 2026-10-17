"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

export function SignOutButton({ tone = "light" }: { tone?: "light" | "dark" }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function handleSignOut() {
    setBusy(true);
    await createClient().auth.signOut();
    router.push("/");
    router.refresh();
  }

  return (
    <button
      type="button"
      onClick={handleSignOut}
      disabled={busy}
      className={cn(
        "rounded-lg px-3 py-1.5 text-sm font-medium transition-colors disabled:opacity-60",
        tone === "light"
          ? "text-muted hover:bg-ink-soft hover:text-ink"
          : "text-white/70 hover:bg-white/10 hover:text-white",
      )}
    >
      {busy ? "Signing out…" : "Sign out"}
    </button>
  );
}
