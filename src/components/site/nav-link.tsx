"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

/** Navigation link that marks the current section (visually + `aria-current`). */
export function NavLink({
  href,
  exact,
  tone = "light",
  children,
}: {
  href: string;
  /** Match only this exact path (otherwise any child path is active too). */
  exact?: boolean;
  tone?: "light" | "dark";
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const active = exact ? pathname === href : pathname === href || pathname.startsWith(`${href}/`);
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={cn(
        "rounded-lg px-3 py-1.5 text-sm font-medium transition-colors",
        tone === "light"
          ? active
            ? "bg-cobalt-soft text-cobalt"
            : "text-ink hover:bg-ink-soft"
          : active
            ? "bg-white/15 text-white"
            : "text-white/70 hover:bg-white/10 hover:text-white",
      )}
    >
      {children}
    </Link>
  );
}
