import { TEMPLATE_HTML } from "./template-html";
import { safeImageSrc } from "./safe-url";

/** Page-block type that holds a whole ready-made template. */
export const TEMPLATE_SITE = "TemplateSite";

export const TEMPLATE_CATALOG = [
  { key: "restaurant", name: "Restaurant", nameAr: "مطعم" },
  { key: "cafe", name: "Café", nameAr: "كافيه" },
  { key: "bakery", name: "Bakery", nameAr: "مخبز" },
  { key: "salon", name: "Salon", nameAr: "صالون" },
  { key: "clinic", name: "Clinic", nameAr: "عيادة" },
  { key: "gym", name: "Gym", nameAr: "جيم" },
  { key: "shop", name: "Shop", nameAr: "متجر" },
  { key: "portfolio", name: "Portfolio", nameAr: "أعمال شخصية" },
  { key: "agency", name: "Agency", nameAr: "وكالة" },
  { key: "jewellery", name: "Jewellery", nameAr: "مجوهرات" },
] as const;

export const isTemplateKey = (v: unknown): v is string =>
  typeof v === "string" && Object.prototype.hasOwnProperty.call(TEMPLATE_HTML, v);

export interface TemplateProps {
  id: string;
  templateKey: string;
  /** Replacement text per text-slot index. Slots not listed keep the template's own text. */
  texts: Record<string, string>;
  /** Replacement URL per image-slot index. */
  images: Record<string, string>;
  dir: "ltr" | "rtl";
}

// Tokens: comments, whole <script>/<style> elements, tags, and text. Text and image URLs are the
// "slots" a customer can change; everything else (markup, CSS, scripts, fonts) stays byte-for-byte.
const TOKEN = /<!--[\s\S]*?-->|<(script|style)\b[\s\S]*?<\/\1\s*>|<[^>]+>|[^<]+/gi;
const CSS_URL = /(url\(\s*['"]?)(https?:\/\/[^'")\s]+)(['"]?\s*\))/gi;
const IMG_SRC = /(\bsrc\s*=\s*")([^"]*)(")/i;
const HAS_WORD = /[A-Za-z0-9À-ɏ؀-ۿ]/;

const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
const escAttr = (s: string) => esc(s).replace(/"/g, "&quot;");
const cssSafe = (s: string) => s.replace(/['"()\s\\]/g, "");

interface Opts {
  texts?: Record<string, string>;
  images?: Record<string, string>;
  edit?: boolean;
}

function walk(source: string, o: Opts) {
  const texts: string[] = [];
  const images: string[] = [];
  let prev = "";

  const swapImage = (url: string, i: number, inAttr: boolean) => {
    const v = o.images?.[i];
    const safe = v ? safeImageSrc(v) : "";
    if (!safe) return url;
    return inAttr ? escAttr(safe) : cssSafe(safe);
  };

  const out = source.replace(TOKEN, (tok: string, el?: string) => {
    if (tok.startsWith("<!--")) return tok;
    if (el) {
      if (el.toLowerCase() !== "style") return tok;
      return tok.replace(CSS_URL, (_m: string, a: string, u: string, b: string) => a + swapImage(u, images.push(u) - 1, false) + b);
    }
    if (tok.charAt(0) === "<") {
      prev = tok;
      let t = tok;
      if (/^<img\b/i.test(t)) {
        let first = -1;
        t = t.replace(IMG_SRC, (_m: string, a: string, u: string, b: string) => {
          first = images.push(u) - 1;
          return a + swapImage(u, first, true) + b;
        });
        if (o.edit && first >= 0) t = t.replace(/^<img\b/i, `<img data-ws-i="${first}"`);
      }
      return t.replace(CSS_URL, (_m: string, a: string, u: string, b: string) => a + swapImage(u, images.push(u) - 1, true) + b);
    }
    const m = /^(\s*)([\s\S]*?)(\s*)$/.exec(tok) as RegExpExecArray;
    const core = m[2];
    if (!HAS_WORD.test(core)) return tok;
    const i = texts.push(core) - 1;
    const v = o.texts?.[i];
    const body = v === undefined ? core : esc(v);
    if (o.edit && !/^<(title|textarea|option)\b/i.test(prev)) return `${m[1]}<span data-ws-t="${i}">${body}</span>${m[3]}`;
    return m[1] + body + m[3];
  });
  return { out, texts, images };
}

/** The template's own text snippets and image URLs, in slot order. */
export function listSlots(key: string): { texts: string[]; images: string[] } {
  const src = TEMPLATE_HTML[key];
  if (!src) return { texts: [], images: [] };
  const { texts, images } = walk(src, {});
  return { texts, images };
}

const EDIT_SCRIPT = `(function(){
var P=function(m){m.ws=1;parent.postMessage(m,'*')};
document.addEventListener('click',function(e){
var a=e.target.closest&&e.target.closest('a[href]');if(a)e.preventDefault();
var im=e.target.closest&&e.target.closest('img[data-ws-i]');if(im){e.preventDefault();P({t:'img',id:+im.getAttribute('data-ws-i')})}
},true);
function init(){document.querySelectorAll('[data-ws-t]').forEach(function(s){
s.setAttribute('contenteditable','true');s.setAttribute('spellcheck','false');
s.addEventListener('input',function(){P({t:'text',id:+s.getAttribute('data-ws-t'),v:s.textContent})});
s.addEventListener('keydown',function(e){if(e.key==='Enter'){e.preventDefault();s.blur()}});
s.addEventListener('paste',function(e){e.preventDefault();var t=(e.clipboardData||window.clipboardData).getData('text');document.execCommand('insertText',false,t)});
})}
var st=document.createElement('style');
st.textContent='[data-ws-t]{outline:1px dashed transparent;outline-offset:2px;cursor:text;transition:outline-color .15s}[data-ws-t]:hover{outline-color:rgba(253,107,71,.9)}[data-ws-t]:focus{outline:2px solid #FD6B47;background:rgba(253,107,71,.08)}img[data-ws-i]{cursor:pointer}img[data-ws-i]:hover{outline:3px solid #FD6B47}';
document.head.appendChild(st);
if(document.readyState!=='loading')init();else document.addEventListener('DOMContentLoaded',init);
})();`;

/**
 * The template's own HTML with the customer's text and images swapped in.
 * With no overrides the result is identical to the original file.
 * `edit` wraps each text in a click-to-edit span and adds the editor script (editor/preview only, never published).
 */
export function renderTemplate(
  key: string,
  p: { texts?: Record<string, string>; images?: Record<string, string>; dir?: "ltr" | "rtl" } = {},
  edit = false,
): string {
  const src = TEMPLATE_HTML[key];
  if (!src) return "";
  let { out } = walk(src, { texts: p.texts, images: p.images, edit });
  if (p.dir === "rtl") out = out.replace(/<html\b[^>]*>/i, '<html lang="ar" dir="rtl">');
  if (edit) {
    const tag = `<script>${EDIT_SCRIPT}</script>`;
    out = /<\/body>/i.test(out) ? out.replace(/<\/body>/i, () => tag + "</body>") : out + tag;
  }
  return out;
}

const record = (v: unknown): Record<string, string> => {
  const o: Record<string, string> = {};
  if (v && typeof v === "object") {
    for (const [k, x] of Object.entries(v as Record<string, unknown>)) {
      if (/^\d{1,4}$/.test(k) && typeof x === "string") o[k] = x;
    }
  }
  return o;
};

/** The page's template block, normalised, or null when the page is an ordinary Puck page. */
export function getTemplateBlock(blocks: unknown): { props: TemplateProps } | null {
  if (!Array.isArray(blocks)) return null;
  for (const b of blocks) {
    if (!b || typeof b !== "object") continue;
    const it = b as { type?: unknown; props?: unknown };
    if (it.type !== TEMPLATE_SITE || !it.props || typeof it.props !== "object") continue;
    const p = it.props as Record<string, unknown>;
    if (!isTemplateKey(p.templateKey)) return null;
    return {
      props: {
        id: typeof p.id === "string" && p.id ? p.id : "tpl",
        templateKey: p.templateKey,
        texts: record(p.texts),
        images: record(p.images),
        dir: p.dir === "rtl" ? "rtl" : "ltr",
      },
    };
  }
  return null;
}

export function makeTemplateBlock(
  templateKey: string,
  texts: Record<string, string>,
  images: Record<string, string>,
  dir: "ltr" | "rtl",
) {
  return { type: TEMPLATE_SITE, props: { id: `tpl-${Math.random().toString(36).slice(2, 9)}`, templateKey, texts, images, dir } };
}
