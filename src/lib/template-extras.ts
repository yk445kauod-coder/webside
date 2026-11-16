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
  /** Shown first under the ⭐ chip with a badge. */
  rec: boolean;
  /** Sold out / hidden from the published menu. */
  off: boolean;
  /** Comma-separated ingredients shown in the item sheet. */
  ing: string;
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
      items.push({ name, price: str(i.price, 20).trim(), desc: str(i.desc, 300).trim(), img: safeImageSrc(str(i.img, 500)) || "", rec: i.rec === true, off: i.off === true, ing: str(i.ing, 300).trim() });
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
    const rec = /\*\s*$/.test(parts[0]);
    cur.items.push({ name: parts[0].replace(/\s*\*\s*$/, "").slice(0, 120), price: (parts[1] ?? "").slice(0, 20), desc: parts.slice(2).join(" ").slice(0, 300), img: "", rec, off: false, ing: "" });
  }
  return normalizeMenu({ ...into, categories: cats }) ?? into;
}

const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

const MENU_CSS = `#ws-menu{--c:#FD6B47;max-width:1100px;margin:0 auto;padding:48px 14px;font-family:inherit;color:inherit}
#ws-menu h2{margin:0 0 18px;font-size:clamp(26px,5vw,40px);text-align:center}
#ws-menu .wm-bar{position:sticky;top:0;z-index:20;background:#fff;color:#152137;padding:10px 0 8px;border-bottom:1px solid #0001;box-shadow:0 6px 14px -12px #0006}
#ws-menu input{width:100%;box-sizing:border-box;border:1px solid #0003;border-radius:14px;padding:12px 14px;font:inherit;font-size:16px;background:#fff;color:#152137}
#ws-menu .wm-cats{display:flex;gap:8px;overflow-x:auto;padding:10px 0 2px;scrollbar-width:none}
#ws-menu .wm-cats::-webkit-scrollbar{display:none}
#ws-menu .wm-cats button{flex:none;display:flex;align-items:center;gap:6px;border:1px solid #0002;background:#fff;color:#152137;border-radius:16px;padding:8px 14px;font:inherit;font-size:14px;font-weight:600;cursor:pointer;white-space:nowrap}
#ws-menu .wm-cats b{font-size:11px;background:#0001;border-radius:99px;padding:1px 7px}
#ws-menu .wm-cats button[aria-pressed=true]{background:var(--c);border-color:var(--c);color:#fff}
#ws-menu .wm-cats button[aria-pressed=true] b{background:#fff3}
#ws-menu .wm-count{margin:12px 2px 0;font-size:13px;opacity:.65}
#ws-menu ul{list-style:none;margin:14px 0 0;padding:0;display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px}
@media(min-width:700px){#ws-menu ul{grid-template-columns:repeat(auto-fill,minmax(210px,1fr));gap:16px}}
#ws-menu li{position:relative;display:flex;flex-direction:column;border:1px solid #0001;border-radius:18px;background:#fff;color:#152137;overflow:hidden;cursor:pointer;box-shadow:0 2px 8px #0001;content-visibility:auto;contain-intrinsic-size:0 220px}
#ws-menu li:active{transform:scale(.97)}
#ws-menu .wm-im{position:relative;height:130px;background:#f1ece4;display:grid;place-items:center;font-size:38px;overflow:hidden}
#ws-menu .wm-im img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover}
#ws-menu .wm-badge{position:absolute;top:8px;inset-inline-end:8px;background:linear-gradient(90deg,#fbbf24,#f97316);color:#fff;font-size:10px;font-weight:800;border-radius:99px;padding:2px 8px}
#ws-menu .wm-b{padding:10px 12px 12px;display:flex;flex-direction:column;gap:6px}
#ws-menu .wm-n{font-weight:700;font-size:14px;line-height:1.35;overflow:hidden;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical}
#ws-menu .wm-p{color:var(--c);font-weight:800;font-size:16px}
#ws-menu .wm-p small{font-size:10px;opacity:.75;margin-inline-start:3px}
#ws-menu .wm-pg{display:flex;justify-content:center;flex-wrap:wrap;gap:6px;margin:22px 0 4px}
#ws-menu .wm-pg button{min-width:40px;height:40px;border:1px solid #0002;background:#fff;color:#152137;border-radius:12px;font:inherit;font-weight:700;cursor:pointer}
#ws-menu .wm-pg button[aria-current=page]{background:#152137;color:#fff;border-color:#152137}
#ws-menu .wm-pg button:disabled{opacity:.3}
#ws-menu [hidden]{display:none!important}
#ws-menu .wm-empty{text-align:center;padding:40px 12px;opacity:.7}
#wm-sheet{position:fixed;inset:0;z-index:2147483000;display:flex;align-items:flex-end;justify-content:center}
#wm-sheet[hidden]{display:none}
#wm-sheet .wm-bk{position:absolute;inset:0;background:#0009}
#wm-sheet .wm-card{position:relative;width:100%;max-width:520px;max-height:88vh;overflow:auto;background:#fff;color:#152137;border-radius:24px 24px 0 0;padding-bottom:20px;font-family:inherit}
@media(min-width:700px){#wm-sheet{align-items:center}#wm-sheet .wm-card{border-radius:24px}}
#wm-sheet img{width:100%;height:220px;object-fit:cover}
#wm-sheet .wm-x{position:absolute;top:10px;inset-inline-end:10px;width:40px;height:40px;border-radius:99px;border:0;background:#000a;color:#fff;font-size:18px;cursor:pointer}
#wm-sheet .wm-t{padding:16px 18px 0;display:flex;justify-content:space-between;gap:10px;font-weight:800;font-size:20px}
#wm-sheet .wm-t span:last-child{color:#FD6B47;white-space:nowrap}
#wm-sheet p{margin:8px 18px 0;line-height:1.7;font-size:15px;opacity:.85}`;

const MENU_JS = `(function(){var r=document.getElementById('ws-menu');if(!r)return;var PER=24;
var q=r.querySelector('input'),bs=[].slice.call(r.querySelectorAll('.wm-cats button')),lis=[].slice.call(r.querySelectorAll('li')),em=r.querySelector('.wm-empty'),pg=r.querySelector('.wm-pg'),cn=r.querySelector('.wm-count'),sh=document.getElementById('wm-sheet'),cat='*',page=1,rtl=r.dir==='rtl';
function nz(t){return(t||'').toLowerCase().replace(/[\\u0623\\u0625\\u0622]/g,'\\u0627').replace(/\\u0629/g,'\\u0647').replace(/\\u0649/g,'\\u064a').replace(/[\\u064B-\\u065F]/g,'').trim()}
lis.forEach(function(l){l._s=nz(l.textContent)});
function run(){var t=nz(q.value),m=lis.filter(function(l){return(!t||l._s.indexOf(t)>-1)&&(cat==='*'||(cat==='\\u2605'?l.getAttribute('data-r')==='1':l.getAttribute('data-c')===cat))});
var n=Math.max(1,Math.ceil(m.length/PER));if(page>n)page=n;lis.forEach(function(l){l.hidden=true});
m.slice((page-1)*PER,page*PER).forEach(function(l){l.hidden=false});
em.hidden=m.length>0;cn.textContent=m.length+(rtl?' \\u0635\\u0646\\u0641':' items');
pg.innerHTML='';if(n>1){var mk=function(l,p,d,c){var b=document.createElement('button');b.type='button';b.textContent=l;b.disabled=d;if(c)b.setAttribute('aria-current','page');b.onclick=function(){page=p;run();r.scrollIntoView({behavior:'smooth'})};pg.appendChild(b)};
mk(rtl?'\\u2192':'\\u2190',page-1,page<2);var s=Math.max(1,Math.min(page-2,n-4)),e=Math.min(n,s+4);for(var i=s;i<=e;i++)mk(String(i),i,false,i===page);mk(rtl?'\\u2190':'\\u2192',page+1,page>=n)}}
q.addEventListener('input',function(){page=1;run()});
bs.forEach(function(b){b.addEventListener('click',function(){cat=b.getAttribute('data-c');page=1;bs.forEach(function(x){x.setAttribute('aria-pressed',String(x===b))});run()})});
function close(){sh.hidden=true;document.body.style.overflow=''}
lis.forEach(function(l){l.addEventListener('click',function(){var im=l.querySelector('.wm-im img'),d=l.querySelector('.wm-d'),g=l.querySelector('.wm-g');
sh.querySelector('.wm-card').innerHTML='<button type=\"button\" class=\"wm-x\" aria-label=\"close\">\\u2715</button>'+(im?'<img src=\"'+im.getAttribute('src')+'\" alt=\"\">':'')+'<div class=\"wm-t\"><span>'+l.querySelector('.wm-n').innerHTML+'</span><span>'+l.querySelector('.wm-p').innerHTML+'</span></div>'+(d?'<p>'+d.innerHTML+'</p>':'')+(g?'<p>'+g.innerHTML+'</p>':'');
sh.hidden=false;document.body.style.overflow='hidden';sh.querySelector('.wm-x').onclick=close})});
sh.querySelector('.wm-bk').onclick=close;document.addEventListener('keydown',function(e){if(e.key==='Escape')close()});
run()})();`;

/** Self-contained menu section: sticky search + category chips with counts, 24-per-page card grid, item sheet. Works with no framework. */
export function menuHtml(m: TemplateMenu, dir: "ltr" | "rtl"): string {
  const ar = dir === "rtl";
  const cats = m.categories.map((c) => ({ ...c, items: c.items.filter((i) => !i.off) })).filter((c) => c.items.length);
  if (!cats.length) return "";
  const total = cats.reduce((n, c) => n + c.items.length, 0);
  const recs = cats.reduce((n, c) => n + c.items.filter((i) => i.rec).length, 0);
  const chip = (c: string, label: string, n: number, on = false) =>
    `<button type="button" data-c="${esc(c)}" aria-pressed="${on}">${label}<b>${n}</b></button>`;
  const chips =
    chip("*", ar ? "الكل" : "All", total, true) +
    (recs ? chip("\u2605", ar ? "⭐ الأفضل" : "⭐ Top picks", recs) : "") +
    cats.filter((c) => c.name).map((c) => chip(c.name, esc(c.name), c.items.length)).join("");
  const cur = m.currency ? `<small>${esc(m.currency)}</small>` : "";
  const lis = cats
    .flatMap((c) =>
      c.items.map(
        (i) =>
          `<li data-c="${esc(c.name)}"${i.rec ? ' data-r="1"' : ""}><div class="wm-im">${i.img ? `<img src="${esc(i.img)}" alt="" loading="lazy" decoding="async">` : "🍽️"}${i.rec ? `<span class="wm-badge">⭐ ${ar ? "مُوصى به" : "TOP"}</span>` : ""}</div><div class="wm-b"><div class="wm-n">${esc(i.name)}</div>${i.price ? `<div class="wm-p">${esc(i.price)}${cur}</div>` : ""}${i.desc ? `<div class="wm-d" hidden>${esc(i.desc)}</div>` : ""}${i.ing ? `<div class="wm-g" hidden>${esc(i.ing)}</div>` : ""}</div></li>`,
      ),
    )
    .join("");
  const ph = ar ? "ابحث عن شيء لذيذ…" : "Search for something tasty…";
  const none = ar ? "مفيش نتائج، جرّب بحث تاني." : "Nothing found.";
  return `<section id="ws-menu" dir="${dir}"><style>${MENU_CSS}</style>${m.title ? `<h2>${esc(m.title)}</h2>` : ""}<div class="wm-bar"><input type="search" placeholder="${ph}" aria-label="${ph}"><div class="wm-cats">${chips}</div></div><div class="wm-count"></div><ul>${lis}</ul><p class="wm-empty" hidden>${none}</p><div class="wm-pg"></div><div id="wm-sheet" hidden dir="${dir}"><div class="wm-bk"></div><div class="wm-card"></div></div><script>${MENU_JS}</script></section>`;
}
