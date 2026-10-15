"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Wordmark } from "@/components/wordmark";
import { createClient } from "@/lib/supabase/client";

export function SudoNav({ displayName }: { displayName: string }) {
  const router = useRouter();
  const supabase = createClient();

  async function handleSignOut() {
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  }

  return (
    <header className="sticky top-0 z-20 border-b border-ink bg-ink text-white">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-6">
        <div className="flex items-center gap-4">
          <Link href="/sudo" aria-label="SUDO home" className="flex items-center gap-2.5">
            <span className="rounded-md bg-cobalt px-2 py-0.5 font-mono text-xs font-bold tracking-widest text-white">
              SUDO
            </span>
            <Wordmark compact variant="mono-white" />
          </Link>
          <nav className="hidden items-center gap-1 sm:flex">
            <Link
              href="/sudo"
              className="rounded-lg px-3 py-1.5 text-sm font-medium text-white/70 hover:bg-white/10 hover:text-white"
            >
              Review
            </Link>
            <Link
              href="/sudo/audit"
              className="rounded-lg px-3 py-1.5 text-sm font-medium text-white/70 hover:bg-white/10 hover:text-white"
            >
              Audit
            </Link>
          </nav>
        </div>

        <div className="flex items-center gap-2">
          <span className="flex items-center gap-2 text-sm text-white/80">
            <span className="grid h-6 w-6 place-items-center rounded-full bg-cobalt text-xs font-bold">
              {displayName.slice(0, 1).toUpperCase()}
            </span>
            <span className="hidden max-w-[10rem] truncate sm:inline">{displayName}</span>
          </span>
          <Link
            href="/dashboard"
            className="ml-1 rounded-lg px-3 py-1.5 text-sm font-medium text-white/70 hover:bg-white/10 hover:text-white"
          >
            Customer view
          </Link>
          <button
            onClick={handleSignOut}
            className="ml-1 rounded-lg px-3 py-1.5 text-sm font-medium text-white/70 hover:bg-white/10 hover:text-white"
          >
            Sign out
          </button>
        </div>
      </div>
    </header>
  );
}