import type { MenuBlock, MenuItem } from "@/lib/types/blocks";
import { safeImageSrc } from "@/lib/safe-url";
import { cn } from "@/lib/utils";

interface Props {
  block: MenuBlock;
  /** Classes for the muted text colour of the surrounding block style. */
  muted: string;
}

// Menu views are pure HTML/CSS so a published menu works with no script:
//  list    — classic: name, dotted leader, price
//  grid    — photo cards
//  compact — dense two-column price list
//  tabs    — sticky category chips that jump to each section
export function MenuView({ block, muted }: Props) {
  const dark = block.style === "ink";
  const cats = block.categories.filter((c) => c.name.trim() || c.items.length > 0);
  const anchor = (i: number) => `menu-${block.id.replace(/[^a-zA-Z0-9]/g, "")}-${i}`;

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-8">
      {block.title ? (
        <h2 className="ws-h2 break-words text-3xl font-bold tracking-tight md:text-4xl">{block.title}</h2>
      ) : null}

      {cats.length === 0 ? <p className={cn("text-sm", muted)}>No menu items yet.</p> : null}

      {block.view === "tabs" && cats.length > 1 ? (
        <nav
          aria-label={block.title || "Menu categories"}
          className={cn(
            "sticky top-0 z-10 -mx-2 flex gap-2 overflow-x-auto px-2 py-2",
            block.style === "ink" ? "bg-ink" : block.style === "tint" ? "bg-copper-soft" : "bg-white",
          )}
        >
          {cats.map((c, i) => (
            <a
              key={i}
              href={`#${anchor(i)}`}
              className={cn(
                "shrink-0 rounded-full border px-4 py-1.5 text-sm font-medium transition-colors",
                dark
                  ? "border-white/25 text-white hover:bg-white/10"
                  : "border-line text-ink hover:border-copper hover:text-copper",
              )}
            >
              {c.name || "Menu"}
            </a>
          ))}
        </nav>
      ) : null}

      {cats.map((c, i) => (
        <section key={i} id={anchor(i)} className="scroll-mt-16 flex flex-col gap-4">
          {c.name ? (
            <h3 className="ws-h2 break-words border-b border-current/15 pb-2 text-xl font-bold text-copper md:text-2xl">
              {c.name}
            </h3>
          ) : null}
          {block.view === "grid" ? (
            <ul className="grid grid-cols-1 items-start gap-4 sm:grid-cols-2">
              {c.items.map((it, j) => (
                <GridItem key={j} item={it} currency={block.currency} dark={dark} muted={muted} />
              ))}
            </ul>
          ) : block.view === "compact" ? (
            <ul className="grid grid-cols-1 gap-x-10 gap-y-2 md:grid-cols-2">
              {c.items.map((it, j) => (
                <Row key={j} item={it} currency={block.currency} muted={muted} compact />
              ))}
            </ul>
          ) : (
            <ul className="flex flex-col gap-5">
              {c.items.map((it, j) => (
                <Row key={j} item={it} currency={block.currency} muted={muted} />
              ))}
            </ul>
          )}
        </section>
      ))}
    </div>
  );
}

function Price({ item, currency }: { item: MenuItem; currency: string }) {
  if (!item.price.trim()) return null;
  return (
    <span className="shrink-0 whitespace-nowrap font-semibold text-copper">
      {item.price}
      {currency ? <span className="ms-1 text-[0.8em] font-medium opacity-80">{currency}</span> : null}
    </span>
  );
}

function Badge({ text, available }: { text: string; available: boolean }) {
  const label = available ? text : "Sold out";
  if (!label) return null;
  return (
    <span
      className={cn(
        "self-start rounded-full px-2 py-0.5 text-[11px] font-semibold",
        available ? "bg-orange-soft text-orange-ink" : "bg-ink-soft text-ink/70",
      )}
    >
      {label}
    </span>
  );
}

function Row({
  item,
  currency,
  muted,
  compact,
}: {
  item: MenuItem;
  currency: string;
  muted: string;
  compact?: boolean;
}) {
  return (
    <li className={cn(!item.available && "opacity-60")}>
      <div className="flex items-baseline gap-2">
        <span className={cn("break-words font-semibold", compact ? "text-[15px]" : "text-[17px]")}>
          {item.name}
        </span>
        <Badge text={item.badge} available={item.available} />
        <span aria-hidden="true" className="min-w-4 flex-1 translate-y-[-3px] self-end border-b border-dotted border-current/40" />
        <Price item={item} currency={currency} />
      </div>
      {item.description && !compact ? (
        <p className={cn("mt-1 break-words text-[14px] leading-relaxed", muted)}>{item.description}</p>
      ) : null}
    </li>
  );
}

function GridItem({
  item,
  currency,
  dark,
  muted,
}: {
  item: MenuItem;
  currency: string;
  dark: boolean;
  muted: string;
}) {
  const src = safeImageSrc(item.image);
  return (
    <li
      className={cn(
        "flex flex-col overflow-hidden rounded-2xl border",
        dark ? "border-white/15 bg-white/5" : "border-line bg-white text-ink shadow-ws-sm",
        !item.available && "opacity-60",
      )}
    >
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={src}
          alt={item.name}
          loading="lazy"
          decoding="async"
          referrerPolicy="no-referrer"
          className="aspect-[4/3] w-full object-cover"
        />
      ) : null}
      <div className="flex flex-col gap-1.5 p-4">
        <div className="flex items-start justify-between gap-3">
          <span className="break-words text-[17px] font-semibold">{item.name}</span>
          <Price item={item} currency={currency} />
        </div>
        <Badge text={item.badge} available={item.available} />
        {item.description ? (
          <p className={cn("break-words text-[14px] leading-relaxed", dark ? muted : "text-ink/70")}>{item.description}</p>
        ) : null}
      </div>
    </li>
  );
}
