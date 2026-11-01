"use client";

import { Field } from "@/components/ui/field";
import { LIMITS } from "@/lib/limits";
import { cn } from "@/lib/utils";
import type { MenuBlock, MenuCategory, MenuItem, MenuView } from "@/lib/types/blocks";

const views: { value: MenuView; label: string; hint: string }[] = [
  { value: "list", label: "List", hint: "Name, dotted line, price" },
  { value: "grid", label: "Photo cards", hint: "Big photos, 2 per row" },
  { value: "compact", label: "Compact", hint: "Dense two-column prices" },
  { value: "tabs", label: "Tabs", hint: "Category chips that jump to sections" },
];

export const emptyMenuItem = (): MenuItem => ({
  name: "",
  description: "",
  price: "",
  image: "",
  badge: "",
  available: true,
});

const small =
  "rounded-lg border border-dashed border-line px-3 py-1.5 text-xs font-medium text-muted hover:border-copper/50 hover:text-copper";

/** The menu CMS: categories and items, all edited in one place. */
export function MenuControls({
  block,
  onChange,
}: {
  block: MenuBlock;
  onChange: (b: MenuBlock) => void;
}) {
  const setCats = (categories: MenuCategory[]) => onChange({ ...block, categories });
  const setCat = (i: number, patch: Partial<MenuCategory>) =>
    setCats(block.categories.map((c, j) => (j === i ? { ...c, ...patch } : c)));
  const setItem = (ci: number, ii: number, patch: Partial<MenuItem>) =>
    setCat(ci, {
      items: block.categories[ci].items.map((it, k) => (k === ii ? { ...it, ...patch } : it)),
    });
  const move = <T,>(list: T[], from: number, to: number): T[] => {
    if (to < 0 || to >= list.length) return list;
    const next = [...list];
    const [x] = next.splice(from, 1);
    next.splice(to, 0, x);
    return next;
  };

  return (
    <div className="flex flex-col gap-4">
      <Field label="Menu title" value={block.title} maxLength={LIMITS.menuTitle} onChange={(title) => onChange({ ...block, title })} />
      <Field
        label="Currency label"
        hint="Shown after each price, for example EGP or ج.م"
        value={block.currency}
        maxLength={LIMITS.menuCurrency}
        onChange={(currency) => onChange({ ...block, currency })}
      />

      <div role="group" aria-label="Menu view">
        <span className="mb-1.5 block text-sm font-medium text-ink">How the menu looks</span>
        <div className="grid grid-cols-2 gap-2">
          {views.map((v) => (
            <button
              key={v.value}
              type="button"
              aria-pressed={block.view === v.value}
              onClick={() => onChange({ ...block, view: v.value })}
              className={cn(
                "rounded-lg border p-2.5 text-left transition-colors",
                block.view === v.value ? "border-copper bg-copper-soft" : "border-line bg-white hover:border-copper/50",
              )}
            >
              <span className="block text-sm font-semibold text-ink">{v.label}</span>
              <span className="block text-xs text-muted">{v.hint}</span>
            </button>
          ))}
        </div>
      </div>

      {block.categories.map((cat, ci) => (
        <fieldset key={ci} className="flex flex-col gap-3 rounded-xl border border-line bg-canvas p-3">
          <legend className="px-1 text-sm font-semibold text-ink">Category {ci + 1}</legend>
          <Field label="Category name" value={cat.name} maxLength={LIMITS.menuCategoryName} onChange={(name) => setCat(ci, { name })} />
          <div className="flex gap-3 text-xs font-medium">
            <button type="button" className="text-muted hover:text-ink" onClick={() => setCats(move(block.categories, ci, ci - 1))}>Move up</button>
            <button type="button" className="text-muted hover:text-ink" onClick={() => setCats(move(block.categories, ci, ci + 1))}>Move down</button>
            <button type="button" className="ms-auto text-danger hover:underline" onClick={() => setCats(block.categories.filter((_, j) => j !== ci))}>Remove category</button>
          </div>

          {cat.items.map((it, ii) => (
            <div key={ii} className="flex flex-col gap-2 rounded-lg border border-line bg-white p-3">
              <Field label="Item name" value={it.name} maxLength={LIMITS.menuItemName} onChange={(name) => setItem(ci, ii, { name })} />
              <div className="grid grid-cols-2 gap-2">
                <Field label="Price" placeholder="85" value={it.price} maxLength={LIMITS.menuItemPrice} onChange={(price) => setItem(ci, ii, { price })} />
                <Field label="Badge" placeholder="New" value={it.badge} maxLength={LIMITS.menuItemBadge} onChange={(badge) => setItem(ci, ii, { badge })} />
              </div>
              <Field label="Description" textarea rows={2} value={it.description} maxLength={LIMITS.menuItemDescription} onChange={(description) => setItem(ci, ii, { description })} />
              <Field label="Photo URL" placeholder="https://…" value={it.image} maxLength={LIMITS.url} onChange={(image) => setItem(ci, ii, { image })} />
              <label className="flex items-center gap-2 text-sm text-ink">
                <input type="checkbox" checked={it.available} onChange={(e) => setItem(ci, ii, { available: e.target.checked })} />
                Available today
              </label>
              <div className="flex gap-3 text-xs font-medium">
                <button type="button" className="text-muted hover:text-ink" onClick={() => setCat(ci, { items: move(cat.items, ii, ii - 1) })}>Up</button>
                <button type="button" className="text-muted hover:text-ink" onClick={() => setCat(ci, { items: move(cat.items, ii, ii + 1) })}>Down</button>
                <button type="button" className="ms-auto text-danger hover:underline" onClick={() => setCat(ci, { items: cat.items.filter((_, k) => k !== ii) })}>Remove item</button>
              </div>
            </div>
          ))}

          {cat.items.length < LIMITS.menuItemsPerCategory ? (
            <button type="button" className={cn(small, "self-start")} onClick={() => setCat(ci, { items: [...cat.items, emptyMenuItem()] })}>
              + Add item
            </button>
          ) : null}
        </fieldset>
      ))}

      {block.categories.length < LIMITS.menuCategories ? (
        <button
          type="button"
          className={cn(small, "self-start")}
          onClick={() => setCats([...block.categories, { name: "", items: [emptyMenuItem()] }])}
        >
          + Add category
        </button>
      ) : null}
    </div>
  );
}
