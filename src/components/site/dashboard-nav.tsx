"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Wordmark } from "@/components/wordmark";
import { createClient } from "@/lib/supabase/client";

export function DashboardNav({ displayName }: { displayName: string }) {
  const router = useRouter();
  const supabase = createClient();

  async function handleSignOut() {
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  }

  return (
    <header className="sticky top-0 z-20 border-b border-line bg-surface/85 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-6">
        <Link href="/dashboard" aria-label="Go to dashboard">
          <Wordmark compact />
        </Link>
        <div className="flex items-center gap-1">
          <Link
            href="/dashboard"
            className="rounded-lg px-3 py-2 text-sm font-medium text-ink hover:bg-ink-soft"
          >
            My sites
          </Link>
          <span className="hidden items-center gap-2 rounded-full border border-line bg-surface px-2.5 py-1 text-sm text-ink sm:flex">
            <span className="grid h-5 w-5 place-items-center rounded-full bg-cobalt-soft text-[11px] font-semibold text-cobalt">
              {displayName.slice(0, 1).toUpperCase()}
            </span>
            <span className="max-w-[10rem] truncate">{displayName}</span>
          </span>
          <button
            onClick={handleSignOut}
            className="ml-1 rounded-lg px-3 py-2 text-sm font-medium text-muted transition-colors hover:bg-ink-soft hover:text-ink"
          >
            Sign out
          </button>
        </div>
      </div>
    </header>
  );
}