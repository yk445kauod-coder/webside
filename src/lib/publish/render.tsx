import { renderToStaticMarkup } from "react-dom/server.edge";
import { SiteDocument, type NavItem } from "@/components/preview/site-document";
import type { SiteSnapshot } from "@/lib/types/blocks";
import { pathSegments } from "./slug";

export interface RenderedFile {
  /** Path inside the repo, e.g. sites/my-shop/about/index.html */
  path: string;
  content: string;
}

/** 1.5 MB of HTML per site keeps the shared repo and the Pages deploy small. */
export const MAX_SITE_BYTES = 1_500_000;

const esc = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

/** Root-relative links written by the customer must stay inside /<slug>/. */
export function prefixLinks(html: string, slug: string): string {
  return html.replace(/href="\/(?!\/)([^"]*)"/g, (_m, rest: string) => `href="/${slug}/${rest}"`);
}

type Blocks = SiteSnapshot[string]["blocks"];

const clean = (t: string, max: number) => {
  const v = t.replace(/\s+/g, " ").trim();
  return v.length > max ? v.slice(0, max - 1).trimEnd() + "\u2026" : v;
};

/** A search/social description taken from the page's own words (first hero subtitle or paragraph). */
export function pageDescription(blocks: Blocks): string {
  for (const b of blocks) {
    if (b.kind === "hero" && b.subtitle.trim()) return clean(b.subtitle, 160);
    if (b.kind === "paragraph" && b.text.trim()) return clean(b.text, 160);
  }
  return "";
}

/** First http(s) image on the page, used as the social-share preview. */
export function pageImage(blocks: Blocks): string {
  for (const b of blocks) {
    if (b.kind === "image" && /^https?:\/\//i.test(b.src)) return b.src;
    if (b.kind === "gallery") {
      const first = b.images.find((i) => /^https?:\/\//i.test(i.src));
      if (first) return first.src;
    }
  }
  return "";
}

export function renderSite(
  slug: string,
  siteName: string,
  pages: SiteSnapshot,
  origin = "https://web-side.pages.dev",
): { files: RenderedFile[] } | { error: string } {
  const entries = Object.values(pages);
  const resolved: { title: string; segs: string[]; blocks: (typeof entries)[number]["blocks"] }[] = [];
  const seen = new Set<string>();
  for (const p of entries) {
    const segs = pathSegments(p.path);
    if (!segs) return { error: `Page "${p.title}" has an unusable address (${p.path}).` };
    const k = segs.join("/");
    if (seen.has(k)) return { error: `Two pages share the address /${k}.` };
    seen.add(k);
    resolved.push({ title: p.title, segs, blocks: p.blocks });
  }
  if (!seen.has("")) return { error: "The site needs a home page at /." };
  resolved.sort((a, b) => a.segs.length - b.segs.length || a.segs.join("/").localeCompare(b.segs.join("/")));

  // Root-relative on purpose: prefixLinks() adds /<slug> to every such link in one place.
  const href = (segs: string[]) => `/${segs.length ? segs.join("/") + "/" : ""}`;
  const files: RenderedFile[] = [];
  let total = 0;
  for (const page of resolved) {
    const nav: NavItem[] = resolved.map((r) => ({
      title: r.title,
      href: href(r.segs),
      current: r === page,
    }));
    const body = prefixLinks(
      renderToStaticMarkup(<SiteDocument blocks={page.blocks} siteName={siteName} nav={nav} />),
      slug,
    );
    const title = page.segs.length ? `${page.title} · ${siteName}` : siteName;
    const desc = pageDescription(page.blocks) || pageDescription(resolved[0].blocks);
    const img = pageImage(page.blocks) || pageImage(resolved[0].blocks);
    const url = `${origin}${href(page.segs).replace(/^\//, `/${slug}/`)}`;
    const meta =
      `<link rel="canonical" href="${esc(url)}">` +
      (desc ? `<meta name="description" content="${esc(desc)}">` : "") +
      `<meta property="og:type" content="website"><meta property="og:site_name" content="${esc(siteName)}">` +
      `<meta property="og:title" content="${esc(title)}"><meta property="og:url" content="${esc(url)}">` +
      (desc ? `<meta property="og:description" content="${esc(desc)}">` : "") +
      (img ? `<meta property="og:image" content="${esc(img)}">` : "") +
      `<meta name="twitter:card" content="${img ? "summary_large_image" : "summary"}">`;
    const html =
      `<!doctype html><html lang="en"><head><meta charset="utf-8">` +
      `<meta name="viewport" content="width=device-width,initial-scale=1">` +
      `<title>${esc(title)}</title>` +
      meta +
      `<meta name="robots" content="index,follow">` +
      `<link rel="stylesheet" href="/_site/site.css"></head><body>${body}</body></html>`;
    total += Buffer.byteLength(html);
    files.push({ path: `sites/${slug}/${page.segs.length ? page.segs.join("/") + "/" : ""}index.html`, content: html });
  }
  if (total > MAX_SITE_BYTES) return { error: "The site is too large to publish (over 1.5 MB of HTML)." };
  return { files };
}
