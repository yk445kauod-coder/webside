import type { AnyBlock } from "@/lib/types/blocks";
import { BlockView } from "./block-view";

export interface NavItem {
  title: string;
  href: string;
  current: boolean;
}

/** The body of one published page: optional site nav plus the same BlockView the editor uses. */
export function SiteDocument({
  blocks,
  siteName,
  nav,
}: {
  blocks: AnyBlock[];
  siteName: string;
  nav: NavItem[];
}) {
  return (
    <div className="flex min-h-screen flex-col bg-white text-ink">
      {nav.length > 1 ? (
        <nav className="flex flex-wrap items-center gap-x-6 gap-y-2 border-b border-line bg-white px-6 py-4 sm:px-10 md:px-16">
          <span className="font-semibold">{siteName}</span>
          <span className="flex flex-wrap gap-x-5 gap-y-1 text-sm">
            {nav.map((n) => (
              <a
                key={n.href}
                href={n.href}
                aria-current={n.current ? "page" : undefined}
                className={n.current ? "font-semibold text-copper" : "text-ink/70 hover:text-ink"}
              >
                {n.title}
              </a>
            ))}
          </span>
        </nav>
      ) : null}
      <main className="flex flex-1 flex-col">
        {blocks.map((b) => (
          <BlockView key={b.id} block={b} />
        ))}
      </main>
    </div>
  );
}
