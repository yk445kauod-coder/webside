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

export function renderSite(
  slug: string,
  siteName: string,
  pages: SiteSnapshot,
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
    const html =
      `<!doctype html><html lang="en"><head><meta charset="utf-8">` +
      `<meta name="viewport" content="width=device-width,initial-scale=1">` +
      `<title>${esc(title)}</title>` +
      `<meta name="robots" content="index,follow">` +
      `<link rel="stylesheet" href="/_site/site.css"></head><body>${body}</body></html>`;
    total += Buffer.byteLength(html);
    files.push({ path: `sites/${slug}/${page.segs.length ? page.segs.join("/") + "/" : ""}index.html`, content: html });
  }
  if (total > MAX_SITE_BYTES) return { error: "The site is too large to publish (over 1.5 MB of HTML)." };
  return { files };
}
