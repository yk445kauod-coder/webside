"use client";

import { useMemo, useState } from "react";
import { FONTS, FONT_CATEGORIES, fontSpecimenUrl, fontStack, type FontCategory } from "@/lib/fonts";
import { ACCENT_META } from "@/lib/wizard";
import type { AnyBlock, BlockAccent, PageDraft } from "@/lib/types/blocks";
import { cn } from "@/lib/utils";

type Role = "fontHeading" | "fontBody";
const PAGE = 14;

/** Site-wide look: fonts + accent colour, applied to every block on every page. */
export function DesignPanel({
  tabs,
  onApply,
}: {
  tabs: PageDraft[];
  onApply: (patch: Partial<Pick<AnyBlock, "fontHeading" | "fontBody" | "accent">>) => void;
}) {
  const first = tabs.flatMap((t) => t.blocks)[0];
  const [role, setRole] = useState<Role>("fontHeading");
  const [cat, setCat] = useState<FontCategory | "all">("all");
  const [q, setQ] = useState("");
  const [shown, setShown] = useState(PAGE);

  const list = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return FONTS.filter(
      (f) => (cat === "all" || f.category === cat) && (!needle || f.name.toLowerCase().includes(needle)),
    );
  }, [cat, q]);

  const current = first?.[role];
  const accent = first?.accent ?? "indigo";

  return (
    <div className="flex flex-col gap-5 p-3">
      <section>
        <h3 className="mb-2 text-[11px] font-medium uppercase tracking-wider text-muted">Colour</h3>
        <div className="grid grid-cols-3 gap-2">
          {(Object.keys(ACCENT_META) as BlockAccent[]).map((k) => (
            <button
              key={k}
              type="button"
              aria-pressed={accent === k}
              onClick={() => onApply({ accent: k })}
              className={cn(
                "flex flex-col items-center gap-1.5 rounded-xl border p-2 text-[11px] font-medium transition-colors",
                accent === k ? "border-cobalt bg-cobalt-soft" : "border-line bg-white hover:border-cobalt/40",
              )}
            >
              <span className="h-7 w-full rounded-lg" style={{ background: ACCENT_META[k].swatch }} />
              {ACCENT_META[k].label}
            </button>
          ))}
        </div>
      </section>

      <section>
        <h3 className="mb-2 text-[11px] font-medium uppercase tracking-wider text-muted">Fonts</h3>
        <div role="tablist" aria-label="Which text" className="mb-2 flex gap-1 rounded-lg bg-ink-soft p-0.5">
          {([["fontHeading", "Headings"], ["fontBody", "Body"]] as const).map(([r, label]) => (
            <button
              key={r}
              type="button"
              role="tab"
              aria-selected={role === r}
              onClick={() => setRole(r)}
              className={cn(
                "flex-1 rounded-md px-2 py-1 text-xs font-medium",
                role === r ? "bg-surface text-ink shadow-ws-sm" : "text-muted hover:text-ink",
              )}
            >
              {label}
            </button>
          ))}
        </div>

        <input
          type="search"
          value={q}
          onChange={(e) => {
            setQ(e.target.value);
            setShown(PAGE);
          }}
          placeholder={`Search ${FONTS.length} fonts…`}
          aria-label="Search fonts"
          className="mb-2 h-10 w-full rounded-xl border border-line bg-white px-3 text-sm outline-none focus:border-cobalt focus:ring-[3px] focus:ring-cobalt/20"
        />
        <div className="mb-2 flex flex-wrap gap-1">
          {FONT_CATEGORIES.map((c) => (
            <button
              key={c.value}
              type="button"
              aria-pressed={cat === c.value}
              onClick={() => {
                setCat(c.value);
                setShown(PAGE);
              }}
              className={cn(
                "rounded-full border px-2.5 py-1 text-[11px] font-medium",
                cat === c.value ? "border-cobalt bg-cobalt text-white" : "border-line bg-white text-muted hover:text-ink",
              )}
            >
              {c.label}
            </button>
          ))}
        </div>

        <ul className="flex flex-col gap-1.5">
          <li>
            <button
              type="button"
              aria-pressed={!current}
              onClick={() => onApply({ [role]: undefined })}
              className={cn(
                "w-full rounded-xl border px-3 py-2 text-left text-sm",
                !current ? "border-cobalt bg-cobalt-soft" : "border-line bg-white hover:border-cobalt/40",
              )}
            >
              WebSide default
            </button>
          </li>
          {list.slice(0, shown).map((f) => {
            const href = fontSpecimenUrl(f.name);
            const active = current === f.name;
            return (
              <li key={f.name}>
                {href ? <link rel="stylesheet" href={href} precedence="ws-font-specimens" /> : null}
                <button
                  type="button"
                  aria-pressed={active}
                  onClick={() => onApply({ [role]: f.name })}
                  className={cn(
                    "flex w-full items-baseline justify-between gap-3 rounded-xl border px-3 py-2 text-left",
                    active ? "border-cobalt bg-cobalt-soft" : "border-line bg-white hover:border-cobalt/40",
                  )}
                >
                  <span className="truncate text-lg leading-tight" style={{ fontFamily: fontStack(f.name) }}>
                    {f.name}
                  </span>
                  <span className="shrink-0 text-[10px] uppercase tracking-wide text-muted">{f.category}</span>
                </button>
              </li>
            );
          })}
        </ul>
        {list.length === 0 ? <p className="py-3 text-center text-xs text-muted">No fonts match.</p> : null}
        {shown < list.length ? (
          <button
            type="button"
            onClick={() => setShown((n) => n + PAGE)}
            className="mt-2 w-full rounded-xl border border-dashed border-line py-2 text-xs font-medium text-muted hover:border-cobalt/50 hover:text-cobalt"
          >
            Show more ({list.length - shown} left)
          </button>
        ) : null}
      </section>
    </div>
  );
}
