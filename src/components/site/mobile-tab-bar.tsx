"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutGrid, Plus, ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";

/** Thumb-reach navigation for phones; hidden from sm up. */
export function MobileTabBar({ isSudo }: { isSudo?: boolean }) {
  const path = usePathname();
  const items = [
    { href: "/dashboard", label: "Sites", icon: LayoutGrid, active: path === "/dashboard" || path.startsWith("/dashboard/sites") },
    { href: "/dashboard/new", label: "New", icon: Plus, active: path === "/dashboard/new", primary: true },
    ...(isSudo ? [{ href: "/sudo", label: "SUDO", icon: ShieldCheck, active: path.startsWith("/sudo") }] : []),
  ];
  return (
    <nav
      aria-label="Quick navigation"
      className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-white/85 pb-[env(safe-area-inset-bottom)] backdrop-blur-xl sm:hidden"
    >
      <ul className="mx-auto flex max-w-md items-center justify-around px-4 py-1.5">
        {items.map(({ href, label, icon: Icon, active, primary }) => (
          <li key={href}>
            <Link
              href={href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "flex min-h-12 min-w-16 flex-col items-center justify-center gap-0.5 rounded-xl px-3 text-[11px] font-semibold",
                active ? "text-copper" : "text-muted",
              )}
            >
              <span
                className={cn(
                  "grid h-7 w-7 place-items-center rounded-full",
                  primary && "h-9 w-9 text-white shadow-ws-sm",
                )}
                style={primary ? { background: "var(--ws-grad)" } : undefined}
              >
                <Icon className={primary ? "h-5 w-5" : "h-5 w-5"} aria-hidden="true" />
              </span>
              {label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
