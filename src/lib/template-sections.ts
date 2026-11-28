import { TEMPLATE_HTML } from "./template-html";

/** Owner/AI control over the page's structure and palette. Pure and defensive: bad input is ignored, never thrown. */
export interface TemplateSections {
  hidden: number[];
  /** Full permutation of section indexes (display order). Empty = template order. */
  order: number[];
}
export type TemplateTheme = Record<string, string>;

const VOID = /^(area|base|br|col|embed|hr|img|input|link|meta|param|source|track|wbr)$/i;
const SECTION_TAGS = /^(header|nav|section|footer|main|div|aside|article)$/i;
const TOK = /<!--[\s\S]*?-->|<(script|style)\b[\s\S]*?<\/\1\s*>|<(\/?)([a-zA-Z][\w-]*)\b[^>]*?(\/?)>/g;
const COLOR = /^(#[0-9a-f]{3,8}|rgba?\(\s*[\d.\s,%/]+\)|hsla?\(\s*[\d.\sdeg,%/]+\))$/i;

interface Seg { start: number; end: number; section: boolean; tag: string; group: number }

function bodyRange(html: string): { start: number; end: number } | null {
  const m = /<body\b[^>]*>/i.exec(html);
  if (!m) return null;
  const start = m.index + m[0].length;
  const end = html.toLowerCase().lastIndexOf("</body>");
  return end > start ? { start, end } : null;
}

/** Top-level elements of a range by tag depth. Scripts, styles and comments are never sections. */
function segments(html: string, r: { start: number; end: number }, group: number): Seg[] {
  const inner = html.slice(r.start, r.end);
  const out: Seg[] = [];
  let depth = 0;
  let from = -1;
  let tag = "";
  TOK.lastIndex = 0;
  for (let m = TOK.exec(inner); m; m = TOK.exec(inner)) {
    if (m[0].startsWith("<!--") || m[1]) continue;
    const name = m[3].toLowerCase();
    if (m[2]) {
      if (depth > 0) depth--;
      if (depth === 0 && from >= 0) {
        out.push({ start: r.start + from, end: r.start + m.index + m[0].length, section: SECTION_TAGS.test(tag), tag, group });
        from = -1;
      }
    } else if (!VOID.test(name) && !m[4]) {
      if (depth === 0) { from = m.index; tag = name; }
      depth++;
    }
  }
  return out;
}

const textOf = (h: string) => h.replace(/<(script|style)\b[\s\S]*?<\/\1>/gi, " ").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();

export interface SectionInfo { i: number; label: string; group: number }

/** Sections in document order. A top-level <main> is opened up so its own sections (hero, menu, contact...) count. */
function sectionSegs(html: string): Seg[] | null {
  const r = bodyRange(html);
  if (!r) return null;
  const all: Seg[] = [];
  for (const g of segments(html, r, 0)) {
    if (g.tag === "main") {
      const open = html.indexOf(">", g.start) + 1;
      const close = html.toLowerCase().lastIndexOf("</main", g.end);
      if (open > 0 && close > open) { all.push(...segments(html, { start: open, end: close }, 1)); continue; }
    }
    all.push(g);
  }
  const segs = all.filter((s) => s.section && textOf(html.slice(s.start, s.end)).length >= 12);
  return segs.length ? segs : null;
}

/** Sections the owner/AI can hide or reorder, in template order. */
export function listSections(html: string): SectionInfo[] {
  const segs = sectionSegs(html);
  if (!segs) return [];
  return segs.map((g, i) => {
    const h = html.slice(g.start, g.end);
    const id = /\bid="([^"]{1,30})"/i.exec(h.slice(0, 300))?.[1];
    const head = /<h[1-3]\b[^>]*>([\s\S]*?)<\/h[1-3]>/i.exec(h);
    const t = textOf(head ? head[1] : h).slice(0, 40);
    return { i, group: g.group, label: `${g.tag}${id ? "#" + id : ""}: ${t}` };
  });
}

export function normalizeSections(v: unknown, count: number): TemplateSections | undefined {
  if (!v || typeof v !== "object" || count < 1) return undefined;
  const o = v as { hidden?: unknown; order?: unknown };
  const ints = (a: unknown) => (Array.isArray(a) ? a.filter((x): x is number => Number.isInteger(x) && x >= 0 && x < count) : []);
  const hidden = [...new Set(ints(o.hidden))].sort((a, b) => a - b);
  let order = ints(o.order);
  if (new Set(order).size !== count || order.length !== count) order = [];
  if (order.length && order.every((x, i) => x === i)) order = [];
  return hidden.length || order.length ? { hidden, order } : undefined;
}

/** Applies hide/reorder to the page. Hiding only adds an attribute (scripts keep finding their elements). Reordering moves sections only within their own parent. */
export function applySections(html: string, sec: TemplateSections | undefined): string {
  if (!sec) return html;
  const segs = sectionSegs(html);
  if (!segs) return html;
  const ok = normalizeSections(sec, segs.length);
  if (!ok) return html;
  const hide = new Set(ok.hidden);
  const mark = (h: string, i: number) => (hide.has(i) ? h.replace(/^<([a-zA-Z][\w-]*)/, "<$1 data-ws-hide") : h);
  const chunk = segs.map((g, i) => mark(html.slice(g.start, g.end), i));
  const target: number[] = segs.map((_, i) => i); // target[k] = which chunk sits in slot k
  if (ok.order.length) {
    for (const grp of new Set(segs.map((g) => g.group))) {
      const slots = segs.map((g, k) => (g.group === grp ? k : -1)).filter((k) => k >= 0);
      const wanted = ok.order.filter((i) => segs[i].group === grp);
      slots.forEach((k, n) => (target[k] = wanted[n]));
    }
  }
  let out = "";
  let cur = 0;
  segs.forEach((g, k) => {
    out += html.slice(cur, g.start) + chunk[target[k]];
    cur = g.end;
  });
  out += html.slice(cur);
  const style = "<style>[data-ws-hide]{display:none!important}</style>";
  return /<\/head>/i.test(out) ? out.replace(/<\/head>/i, () => style + "</head>") : style + out;
}

/** Colour variables the template defines on :root (fonts and non-colours excluded). */
export function themeVars(key: string): { name: string; value: string }[] {
  const h = TEMPLATE_HTML[key];
  if (!h) return [];
  const root = /:root\s*\{([^}]*)\}/.exec(h)?.[1] ?? "";
  return [...root.matchAll(/(--[\w-]+)\s*:\s*([^;]+)/g)]
    .map((m) => ({ name: m[1], value: m[2].trim() }))
    .filter((v) => COLOR.test(v.value));
}

export function normalizeTheme(v: unknown, key: string): TemplateTheme | undefined {
  if (!v || typeof v !== "object") return undefined;
  const allowed = new Set(themeVars(key).map((x) => x.name));
  const out: TemplateTheme = {};
  for (const [k, c] of Object.entries(v as Record<string, unknown>)) {
    if (allowed.has(k) && typeof c === "string" && COLOR.test(c.trim())) out[k] = c.trim();
  }
  return Object.keys(out).length ? out : undefined;
}

export function themeStyle(theme: TemplateTheme | undefined): string {
  if (!theme) return "";
  const body = Object.entries(theme).map(([k, c]) => `${k}:${c}`).join(";");
  return body ? `<style id="ws-theme">:root{${body}}</style>` : "";
}

/** Pure state change for one section: hide, show, up, down (within its own parent). */
export function changeSection(cur: TemplateSections | undefined, info: SectionInfo[], i: number, action: string): TemplateSections | undefined {
  const n = info.length;
  if (!Number.isInteger(i) || i < 0 || i >= n) return cur;
  const hidden = new Set(cur?.hidden ?? []);
  const order = cur?.order.length === n ? [...cur.order] : info.map((x) => x.i);
  if (action === "hide") hidden.add(i);
  else if (action === "show") hidden.delete(i);
  else if (action === "up" || action === "down") {
    const grp = info[i].group;
    const pos = order.indexOf(i);
    const step = action === "up" ? -1 : 1;
    for (let k = pos + step; k >= 0 && k < n; k += step) {
      if (info[order[k]].group === grp) { [order[pos], order[k]] = [order[k], order[pos]]; break; }
    }
  } else return cur;
  return normalizeSections({ hidden: [...hidden], order }, n);
}
