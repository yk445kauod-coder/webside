import { safeHref, safeImageSrc } from "@/lib/safe-url";

/** One content item as Puck stores it. Slots nest more items inside props. */
export interface PageItem {
  type: string;
  props: { id: string } & Record<string, unknown>;
}

/** Blocks a customer may use. Anything else is dropped on save. RichText is intentionally absent (raw HTML). */
export const ALLOWED_TYPES = [
  "Hero", "Heading", "Text", "Button", "Card", "CTA", "FAQ", "Stats", "Logos", "Steps",
  "FeatureGrid", "FeatureSplit", "Bento", "Grid", "Flex", "Space", 
  "Menu", "Contact", "Image", "Theme",
] as const;
const ALLOWED = new Set<string>(ALLOWED_TYPES);

export const MAX_ITEMS_PER_PAGE = 200;
export const MAX_DEPTH = 8;
export const MAX_STRING = 5000;
export const MAX_BYTES = 400_000;

const LINK_KEYS = /^(href|link|url|mapUrl|qrUrl)$/i;
const IMAGE_KEYS = /^(src|image|imageUrl|logo|photo|poster)$/i;

/** Tiny HTML allow-list for the few rich-text style props (hero description). No attributes except safe href. */
const OK_TAGS = new Set(["p", "br", "strong", "b", "em", "i", "u", "ul", "ol", "li", "h1", "h2", "h3", "a", "span"]);
export function sanitizeHtml(html: string): string {
  return html
    .replace(/<!--[\s\S]*?-->/g, "")
    .replace(/<(script|style|iframe|object|embed)[\s\S]*?<\/\1\s*>/gi, "")
    .replace(/<\/?([a-z][a-z0-9]*)\b([^>]*)>/gi, (m, tag: string, attrs: string) => {
      const t = tag.toLowerCase();
      if (!OK_TAGS.has(t)) return "";
      if (m.startsWith("</")) return `</${t}>`;
      if (t === "a") {
        const h = /href\s*=\s*("([^"]*)"|'([^']*)')/i.exec(attrs);
        const href = safeHref(h ? (h[2] ?? h[3]) : "#");
        return `<a href="${href.replace(/"/g, "&quot;")}" rel="noopener noreferrer">`;
      }
      return `<${t}>`;
    });
}

function cleanValue(key: string, v: unknown, depth: number): unknown {
  if (depth > MAX_DEPTH) return null;
  if (typeof v === "string") {
    const s = v.length > MAX_STRING ? v.slice(0, MAX_STRING) : v;
    if (LINK_KEYS.test(key)) return safeHref(s);
    if (IMAGE_KEYS.test(key)) return s ? safeImageSrc(s) : "";
    if (/<[a-z!\/]/i.test(s)) return sanitizeHtml(s);
    return s;
  }
  if (Array.isArray(v)) return v.slice(0, 500).map((x) => cleanValue(key, x, depth + 1));
  if (v && typeof v === "object") return cleanObject(v as Record<string, unknown>, depth + 1);
  if (typeof v === "number") return Number.isFinite(v) ? v : 0;
  if (typeof v === "boolean" || v === null) return v;
  return null;
}

function cleanObject(o: Record<string, unknown>, depth: number): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(o)) {
    if (k === "__proto__" || k === "constructor" || k === "prototype") continue;
    out[k] = cleanValue(k, v, depth);
  }
  return out;
}

function cleanItem(raw: unknown, depth: number): PageItem | null {
  if (!raw || typeof raw !== "object") return null;
  const r = raw as { type?: unknown; props?: unknown };
  if (typeof r.type !== "string" || !ALLOWED.has(r.type)) return null;
  const props = r.props && typeof r.props === "object" ? (r.props as Record<string, unknown>) : {};
  const cleaned = cleanObject(props, depth + 1);
  // Slot children are items too: drop unknown block types inside them.
  for (const [k, v] of Object.entries(cleaned)) {
    if (Array.isArray(v) && v.length && v.every((x) => x && typeof x === "object" && "type" in (x as object) && "props" in (x as object))) {
      cleaned[k] = v.map((x) => cleanItem(x, depth + 1)).filter(Boolean);
    }
  }
  const id = typeof cleaned.id === "string" && cleaned.id ? cleaned.id.slice(0, 80) : "";
  if (!id) return null;
  return { type: r.type, props: { ...cleaned, id } };
}

export function sanitizeItems(input: unknown):
  | { ok: true; items: PageItem[] }
  | { ok: false; error: string } {
  if (!Array.isArray(input)) return { ok: false, error: "Page content must be a list." };
  if (input.length > MAX_ITEMS_PER_PAGE) return { ok: false, error: `A page can have at most ${MAX_ITEMS_PER_PAGE} blocks.` };
  const items = input.map((x) => cleanItem(x, 0)).filter((x): x is PageItem => x !== null);
  if (JSON.stringify(items).length > MAX_BYTES) return { ok: false, error: "This page is too large." };
  return { ok: true, items };
}
