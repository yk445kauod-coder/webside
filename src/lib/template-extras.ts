import { safeImageSrc } from "./safe-url";

/** Curated Google Fonts a customer can pick for a template site (Arabic-capable ones first). */
export const FONTS = [
  { name: "Cairo", ar: true },
  { name: "Tajawal", ar: true },
  { name: "Almarai", ar: true },
  { name: "IBM Plex Sans Arabic", ar: true },
  { name: "Noto Kufi Arabic", ar: true },
  { name: "Changa", ar: true },
  { name: "El Messiri", ar: true },
  { name: "Amiri", ar: true },
  { name: "Readex Pro", ar: true },
  { name: "Lemonada", ar: true },
  { name: "Inter", ar: false },
  { name: "Poppins", ar: false },
  { name: "Montserrat", ar: false },
  { name: "Playfair Display", ar: false },
  { name: "Lora", ar: false },
  { name: "DM Serif Display", ar: false },
  { name: "Space Grotesk", ar: false },
  { name: "Oswald", ar: false },
] as const;

export const fontOk = (v: unknown): v is string => typeof v === "string" && FONTS.some((f) => f.name === v);

export interface TemplateFonts {
  heading?: string;
  body?: string;
}

export const fontsLink = (names: string[]): string =>
  `https://fonts.googleapis.com/css2?${names.map((n) => `family=${n.replace(/ /g, "+")}:wght@400;600;700`).join("&")}&display=swap`;

export function normalizeFonts(v: unknown): TemplateFonts {
  const o = (v && typeof v === "object" ? v : {}) as Record<string, unknown>;
  const f: TemplateFonts = {};
  if (fontOk(o.heading)) f.heading = o.heading;
  if (fontOk(o.body)) f.body = o.body;
  return f;
}

/** Keeps owner/AI-written CSS harmless: no imports, scripts, remote loads other than https images, or markup breakouts. */
export function sanitizeCss(v: unknown): string {
  if (typeof v !== "string") return "";
  let s = v.slice(0, 4000);
  s = s.replace(/<[^>]*>?/g, "").replace(/\\/g, "");
  s = s.replace(/\/\*[\s\S]*?\*\//g, "");
  s = s.replace(/@(import|charset|namespace|font-face)[^;{]*;?/gi, "");
  s = s.replace(/expression\s*\(|javascript:|behavior\s*:|-moz-binding|data:text|vbscript:/gi, "");
  s = s.replace(/url\(\s*(['"]?)([^)'"]*)\1\s*\)/gi, (_m, _q, u: string) => {
    const safe = /^https:\/\//i.test(u) ? safeImageSrc(u) : "";
    return safe ? `url("${safe.replace(/["()\s]/g, "")}")` : "none";
  });
  // Braces must balance, otherwise the rest of the page's styles could be swallowed.
  let depth = 0;
  for (const ch of s) {
    if (ch === "{") depth++;
    else if (ch === "}") depth--;
    if (depth < 0) return "";
  }
  return depth === 0 ? s.trim() : "";
}

export function styleTags(fonts: TemplateFonts, css: string): string {
  const names = [...new Set([fonts.heading, fonts.body].filter(Boolean) as string[])];
  let out = "";
  if (names.length) out += `<link rel="stylesheet" href="${fontsLink(names)}">`;
  let rules = "";
  if (fonts.body)
    rules += `body,p,li,a,button,input,textarea,select,label,td,th,span:not([class*="icon"]):not([class*="fa-"]),div:not([class*="icon"]):not([class*="fa-"]){font-family:'${fonts.body}',system-ui,sans-serif !important}`;
  if (fonts.heading)
    rules += `h1,h2,h3,h4,h5,h6,[class*="title"],[class*="heading"],[class*="logo"],[class*="brand"]{font-family:'${fonts.heading}',system-ui,sans-serif !important}`;
  if (css) rules += css;
  if (rules) out += `<style id="ws-custom">${rules}</style>`;
  return out;
}

/* ------------------------------------------------------------------ menu / catalogue (CMS) */

export interface MenuItemData {
  name: string;
  price: string;
  desc: string;
  img: string;
}
export interface MenuCategoryData {
  name: string;
  items: MenuItemData[];
}
export interface TemplateMenu {
  title: string;
  currency: string;
  categories: MenuCategoryData[];
}

export const MAX_MENU_ITEMS = 1000;
const str = (v: unknown, n: number) => (typeof v === "string" ? v.slice(0, n) : "");

export function normalizeMenu(v: unknown): TemplateMenu | undefined {
  if (!v || typeof v !== "object") return undefined;
  const o = v as Record<string, unknown>;
  if (!Array.isArray(o.categories)) return undefined;
  let count = 0;
  const categories: MenuCategoryData[] = [];
  for (const c of o.categories.slice(0, 60)) {
    if (!c || typeof c !== "object") continue;
    const cc = c as Record<string, unknown>;
    const items: MenuItemData[] = [];
    for (const it of Array.isArray(cc.items) ? cc.items : []) {
      if (count >= MAX_MENU_ITEMS) break;
      if (!it || typeof it !== "object") continue;
      const i = it as Record<string, unknown>;
      const name = str(i.name, 120).trim();
      if (!name) continue;
      count++;
      items.push({ name, price: str(i.price, 20).trim(), desc: str(i.desc, 300).trim(), img: safeImageSrc(str(i.img, 500)) || "" });
    }
    categories.push({ name: str(cc.name, 80).trim(), items });
  }
  if (!categories.length) return undefined;
  return { title: str(o.title, 80).trim(), currency: str(o.currency, 10).trim(), categories };
}

export const menuCount = (m?: TemplateMenu) => (m ? m.categories.reduce((n, c) => n + c.items.length, 0) : 0);

/**
 * Bulk import. One item per line: `name | price | description`, with `# Category` lines starting a new
 * category (also accepts tabs or commas, so rows pasted from a spreadsheet work).
 */
export function parseBulk(text: string, into: TemplateMenu): TemplateMenu {
  const cats = into.categories.map((c) => ({ name: c.name, items: [...c.items] }));
  let cur = cats[cats.length - 1];
  for (const raw of text.split(/\r?\n/)) {
    const line = raw.trim();
    if (!line) continue;
    if (line.startsWith("#")) {
      const name = line.replace(/^#+\s*/, "").slice(0, 80);
      cur = cats.find((c) => c.name === name) ?? { name, items: [] };
      if (!cats.includes(cur)) cats.push(cur);
      continue;
    }
    const parts = line.split(/\s*[|\t]\s*|\s*,\s*(?=\d)/);
    if (!parts[0]) continue;
    if (!cur) {
      cur = { name: "", items: [] };
      cats.push(cur);
    }
    cur.items.push({ name: parts[0].slice(0, 120), price: (parts[1] ?? "").slice(0, 20), desc: (parts.slice(2).join(" ") ?? "").slice(0, 300), img: "" });
  }
  return normalizeMenu({ ...into, categories: cats }) ?? into;
}

const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

const MENU_CSS = `#ws-menu{--c:#FD6B47;max-width:1100px;margin:0 auto;padding:56px 16px;font-family:inherit;color:inherit}
#ws-menu h2{margin:0 0 20px;font-size:clamp(26px,5vw,40px);text-align:center}
#ws-menu .wm-bar{position:sticky;top:0;z-index:5;background:#fff;color:#152137;padding:10px 0;border-bottom:1px solid #0001}
#ws-menu input{width:100%;box-sizing:border-box;border:1px solid #0003;border-radius:12px;padding:12px 14px;font:inherit;font-size:16px;background:#fff;color:#152137}
#ws-menu .wm-cats{display:flex;gap:8px;overflow-x:auto;padding:10px 0 2px;scrollbar-width:thin}
#ws-menu .wm-cats button{flex:none;border:1px solid #0003;background:#fff;color:#152137;border-radius:999px;padding:8px 14px;font:inherit;font-size:14px;cursor:pointer;white-space:nowrap}
#ws-menu .wm-cats button[aria-pressed=true]{background:var(--c);border-color:var(--c);color:#fff}
#ws-menu .wm-scroll{max-height:72vh;overflow:auto;padding:16px 2px;overscroll-behavior:contain}
#ws-menu h3{margin:18px 0 10px;font-size:20px;color:var(--c)}
#ws-menu ul{list-style:none;margin:0;padding:0;display:grid;grid-template-columns:repeat(auto-fill,minmax(230px,1fr));gap:12px}
#ws-menu li{display:flex;flex-direction:column;gap:6px;border:1px solid #0002;border-radius:14px;padding:12px;background:#fff;color:#152137;overflow:hidden}
#ws-menu li img{width:100%;height:130px;object-fit:cover;border-radius:10px}
#ws-menu .wm-top{display:flex;justify-content:space-between;gap:8px;font-weight:600}
#ws-menu .wm-p{color:var(--c);white-space:nowrap}
#ws-menu .wm-d{font-size:13px;opacity:.75;line-height:1.5}
#ws-menu [hidden]{display:none!important}
#ws-menu .wm-empty{text-align:center;padding:24px;opacity:.7}`;

const MENU_JS = `(function(){var r=document.getElementById('ws-menu');if(!r)return;var q=r.querySelector('input'),bs=r.querySelectorAll('.wm-cats button'),secs=r.querySelectorAll('section'),em=r.querySelector('.wm-empty'),cat='';
function run(){var t=q.value.trim().toLowerCase(),any=false;secs.forEach(function(s){var h=0;s.querySelectorAll('li').forEach(function(l){var m=(!t||l.textContent.toLowerCase().indexOf(t)>-1)&&(!cat||s.getAttribute('data-c')===cat);l.hidden=!m;if(m)h++});s.hidden=!h;if(h)any=true});em.hidden=any}
q.addEventListener('input',run);bs.forEach(function(b){b.addEventListener('click',function(){cat=b.getAttribute('data-c')||'';bs.forEach(function(x){x.setAttribute('aria-pressed',String(x===b))});run()})})})();`;

/** Self-contained menu section (own CSS, search + category filter script) inserted into the template page. */
export function menuHtml(m: TemplateMenu, dir: "ltr" | "rtl"): string {
  const cats = m.categories.filter((c) => c.items.length);
  if (!cats.length) return "";
  const chips = [`<button type="button" data-c="" aria-pressed="true">${dir === "rtl" ? "الكل" : "All"}</button>`]
    .concat(cats.filter((c) => c.name).map((c) => `<button type="button" data-c="${esc(c.name)}" aria-pressed="false">${esc(c.name)}</button>`))
    .join("");
  const body = cats
    .map((c) => {
      const lis = c.items
        .map(
          (i) =>
            `<li>${i.img ? `<img src="${esc(i.img)}" alt="" loading="lazy">` : ""}<div class="wm-top"><span>${esc(i.name)}</span>${i.price ? `<span class="wm-p">${esc(i.price)}${m.currency ? " " + esc(m.currency) : ""}</span>` : ""}</div>${i.desc ? `<div class="wm-d">${esc(i.desc)}</div>` : ""}</li>`,
        )
        .join("");
      return `<section data-c="${esc(c.name)}">${c.name ? `<h3>${esc(c.name)}</h3>` : ""}<ul>${lis}</ul></section>`;
    })
    .join("");
  const ph = dir === "rtl" ? "ابحث في القائمة…" : "Search the menu…";
  const none = dir === "rtl" ? "مفيش نتائج." : "No matching items.";
  return `<section id="ws-menu" dir="${dir}"><style>${MENU_CSS}</style>${m.title ? `<h2>${esc(m.title)}</h2>` : ""}<div class="wm-bar"><input type="search" placeholder="${ph}" aria-label="${ph}"><div class="wm-cats">${chips}</div></div><div class="wm-scroll">${body}<p class="wm-empty" hidden>${none}</p></div><script>${MENU_JS}</script></section>`;
}
