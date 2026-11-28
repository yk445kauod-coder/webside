import { FONTS, fontOk, menuCount, normalizeMenu, sanitizeCss, type TemplateMenu } from "./template-extras";
import { safeImageSrc } from "./safe-url";
import { changeSection, listSections, normalizeTheme, themeVars } from "./template-sections";
import { prepareTemplate } from "./template-site";
import { TEMPLATE_HTML } from "./template-html";
import type { TemplateProps } from "./template-site";

export type TplOp =
  | { op: "text"; i: number; v: string }
  | { op: "font"; heading?: string; body?: string }
  | { op: "css"; css: string }
  | { op: "image"; i: number; url: string }
  | { op: "menu_add"; category?: string; name: string; price?: string; desc?: string }
  | { op: "menu_remove"; name: string }
  | { op: "theme"; vars: Record<string, string> }
  | { op: "section"; i: number; action: "hide" | "show" | "up" | "down" };

const MAX_SNIPPETS = 260;

/** Prompt for the template agent: what it can do, the current text slots, fonts and menu. */
const sectionsOf = (key: string) => listSections(prepareTemplate(TEMPLATE_HTML[key] ?? ""));

/** Prompt for the template agent: the page map (sections, colours, fonts, menu) and every op it may use. */
export function templatePrompt(texts: string[], p: TemplateProps): string {
  const slots = texts
    .slice(0, MAX_SNIPPETS)
    .map((t, i) => `${i}|${(p.texts[i] ?? t).replace(/\s+/g, " ").slice(0, 80)}`)
    .join("\n");
  const hidden = new Set(p.sections?.hidden ?? []);
  const secs = sectionsOf(p.templateKey).map((s) => `${s.i}|${hidden.has(s.i) ? "[HIDDEN] " : ""}${s.label}`).join("\n");
  const cols = themeVars(p.templateKey).map((v) => `${v.name}=${p.theme?.[v.name] ?? v.value}`).join(", ");
  return `You are the site manager of a ready-made website and you act for its owner. Be decisive: do what was asked with ops, never ask permission, never refuse a reasonable design/content change.
Reply ONLY with JSON: {"reply":"one or two short sentences in the owner's language saying what you changed","ops":[...]}.
Allowed ops:
{"op":"text","i":<slot>,"v":"new text"}  replace one text slot (use many ops to rewrite a whole section)
{"op":"theme","vars":{"--name":"#hex"}}  change the site's colours. Only these variables exist: ${cols || "none"}. To make a dark/light/other mood, change several together and keep text readable (strong contrast between text and background variables).
{"op":"section","i":<section>,"action":"hide|show|up|down"}  hide/show/move a page section
{"op":"font","heading":"<font>","body":"<font>"}  fonts from: ${FONTS.map((f) => f.name).join(", ")}
{"op":"css","css":"<css rules>"}  extra CSS for anything else (spacing, sizes, radius, shadows). Replaces the previous custom CSS, so repeat the rules you want to keep. No @import, no scripts.
{"op":"image","i":<slot>,"url":"https://…"}
{"op":"menu_add","category":"…","name":"…","price":"…","desc":"…"}  adds a menu item (max 40 per reply)
{"op":"menu_remove","name":"…"}
Rules: only use slot/section numbers listed below; keep the owner's language; never break the page. The site has its own menu section (items: ${menuCount(p.menu)}); when the owner has menu items and the template also shows a sample menu/products section, hide the template's sample one so the menu is not shown twice.
Current fonts: ${p.fonts?.heading ?? "template default"} / ${p.fonts?.body ?? "template default"}. Current custom CSS: ${(p.css ?? "").slice(0, 400) || "none"}.
Sections (number|name):
${secs}
Text slots (number|current text):
${slots}`;
}

export function parseTplReply(raw: string): { reply: string; ops: TplOp[] } {
  const m = /\{[\s\S]*\}/.exec(raw);
  if (m) {
    try {
      const j = JSON.parse(m[0]) as { reply?: unknown; ops?: unknown };
      const ops = Array.isArray(j.ops) ? (j.ops as TplOp[]) : [];
      return { reply: typeof j.reply === "string" && j.reply ? j.reply : "تمام.", ops };
    } catch {
      /* fall through */
    }
  }
  return { reply: raw.trim().slice(0, 400) || "مقدرتش أفهم الطلب، جرّب تصيغه تاني.", ops: [] };
}

/** Applies ops purely and defensively: anything unknown or malformed is skipped, never thrown. */
export function applyTplOps(p: TemplateProps, ops: TplOp[], slotCount: number, imageCount: number): { props: TemplateProps; applied: number } {
  let cur: TemplateProps = { ...p, texts: { ...p.texts }, images: { ...p.images } };
  let applied = 0;
  let adds = 0;
  for (const o of ops.slice(0, 80)) {
    if (!o || typeof o !== "object") continue;
    if (o.op === "text" && Number.isInteger(o.i) && o.i >= 0 && o.i < slotCount && typeof o.v === "string" && o.v.trim()) {
      cur.texts[o.i] = o.v.slice(0, 2000);
      applied++;
    } else if (o.op === "font") {
      const f = { ...(cur.fonts ?? {}) };
      let ch = false;
      if (fontOk(o.heading)) { f.heading = o.heading; ch = true; }
      if (fontOk(o.body)) { f.body = o.body; ch = true; }
      if (ch) { cur = { ...cur, fonts: f }; applied++; }
    } else if (o.op === "css" && typeof o.css === "string") {
      const css = sanitizeCss(o.css);
      if (css || !o.css.trim()) { cur = { ...cur, css }; applied++; }
    } else if (o.op === "image" && Number.isInteger(o.i) && o.i >= 0 && o.i < imageCount && typeof o.url === "string") {
      const u = safeImageSrc(o.url);
      if (u) { cur.images[o.i] = u; applied++; }
    } else if (o.op === "menu_add" && typeof o.name === "string" && o.name.trim() && adds < 40) {
      const menu: TemplateMenu = cur.menu ? structuredClone(cur.menu) : { title: "", currency: "", categories: [] };
      const cn = typeof o.category === "string" ? o.category.trim().slice(0, 80) : "";
      let cat = menu.categories.find((c) => c.name === cn);
      if (!cat) { cat = { name: cn, items: [] }; menu.categories.push(cat); }
      cat.items.push({ name: o.name.slice(0, 120), price: String(o.price ?? "").slice(0, 20), desc: String(o.desc ?? "").slice(0, 300), img: "", rec: false, off: false, ing: "" });
      const n = normalizeMenu(menu);
      if (n) { cur = { ...cur, menu: n }; adds++; applied++; }
    } else if (o.op === "theme" && o.vars && typeof o.vars === "object") {
      const t = normalizeTheme(o.vars, cur.templateKey);
      if (t) { cur = { ...cur, theme: { ...(cur.theme ?? {}), ...t } }; applied++; }
    } else if (o.op === "section" && typeof o.action === "string") {
      const next = changeSection(cur.sections, sectionsOf(cur.templateKey), o.i, o.action);
      if (JSON.stringify(next) !== JSON.stringify(cur.sections)) { cur = { ...cur, sections: next }; applied++; }
    } else if (o.op === "menu_remove" && cur.menu && typeof o.name === "string") {
      const nm = o.name.trim();
      const menu = structuredClone(cur.menu);
      let hit = false;
      for (const c of menu.categories) {
        const before = c.items.length;
        c.items = c.items.filter((i) => i.name !== nm);
        if (c.items.length !== before) hit = true;
      }
      if (hit) { cur = { ...cur, menu: normalizeMenu(menu) }; applied++; }
    }
  }
  return { props: cur, applied };
}
