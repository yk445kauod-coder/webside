import Link from "next/link";
import { Wordmark } from "@/components/wordmark";
import { NavLink } from "@/components/site/nav-link";
import { SignOutButton } from "@/components/site/sign-out-button";

export function DashboardNav({
  displayName,
  isSudo,
}: {
  displayName: string;
  isSudo?: boolean;
}) {
  return (
    <header className="sticky top-0 z-20 border-b border-line bg-surface/85 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-5xl items-center justify-between gap-3 px-4 sm:px-6">
        <Link href="/dashboard" aria-label="WebSide dashboard">
          <Wordmark compact />
        </Link>
        <nav aria-label="Main" className="flex items-center gap-1">
          <NavLink href="/dashboard">My sites</NavLink>
          {isSudo ? <NavLink href="/sudo">SUDO</NavLink> : null}
          <span className="ml-1 hidden items-center gap-2 rounded-full border border-line bg-surface px-2.5 py-1 text-sm text-ink sm:flex">
            <span
              aria-hidden="true"
              className="grid h-5 w-5 place-items-center rounded-full bg-cobalt-soft text-[11px] font-semibold text-cobalt"
            >
              {displayName.slice(0, 1).toUpperCase()}
            </span>
            <span className="max-w-[10rem] truncate">{displayName}</span>
          </span>
          <SignOutButton />
        </nav>
      </div>
    </header>
  );
}
