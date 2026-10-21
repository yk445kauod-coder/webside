import Link from "next/link";
import { Wordmark } from "@/components/wordmark";
import { NavLink } from "@/components/site/nav-link";
import { SignOutButton } from "@/components/site/sign-out-button";

export function SudoNav({ displayName }: { displayName: string }) {
  return (
    <header className="sticky top-0 z-20 border-b border-ink bg-ink text-white">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-3 px-4 sm:px-6">
        <div className="flex min-w-0 items-center gap-3 sm:gap-4">
          <Link href="/sudo" aria-label="SUDO home" className="flex items-center gap-2.5">
            <span className="rounded-md bg-cobalt px-2 py-0.5 font-mono text-xs font-bold tracking-widest text-white">
              SUDO
            </span>
            <span className="hidden sm:inline">
              <Wordmark compact variant="mono-white" />
            </span>
          </Link>
          <nav aria-label="SUDO" className="flex items-center gap-1">
            <NavLink href="/sudo" exact tone="dark">
              Review
            </NavLink>
            <NavLink href="/sudo/audit" tone="dark">
              Audit
            </NavLink>
            <NavLink href="/sudo/settings" tone="dark">
              Settings
            </NavLink>
          </nav>
        </div>

        <div className="flex items-center gap-1">
          <span className="hidden items-center gap-2 text-sm text-white/80 md:flex">
            <span
              aria-hidden="true"
              className="grid h-6 w-6 place-items-center rounded-full bg-cobalt text-xs font-bold"
            >
              {displayName.slice(0, 1).toUpperCase()}
            </span>
            <span className="max-w-[10rem] truncate">{displayName}</span>
          </span>
          <NavLink href="/dashboard" tone="dark">
            Customer view
          </NavLink>
          <SignOutButton tone="dark" />
        </div>
      </div>
    </header>
  );
}
