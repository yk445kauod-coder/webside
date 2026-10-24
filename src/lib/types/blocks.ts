// ============================================================
// WebSide block model — the editor's content unit.
// Blocks are serialisable JSON stored in pages.blocks and inside
// revision snapshots. Unknown blocks render as a quiet placeholder
// so old snapshots never crash the preview.
// ============================================================

export type BlockKind =
  | "hero"
  | "heading"
  | "paragraph"
  | "image"
  | "button"
  | "divider"
  | "quote"
  | "columns"
  | "cta"
  | "faq"
  | "stats"
  | "gallery"
  | "menu"
  | "footer";

export type BlockStyle = "light" | "tint" | "ink";
export type BlockAccent = "indigo" | "oxide" | "sunset" | "forest" | "ocean" | "rose" | "mono";
export type ButtonVariant = "primary" | "secondary" | "ghost";

export interface Block<
  K extends BlockKind = BlockKind,
> {
  id: string;
  kind: K;
  style: BlockStyle;
  /** Optional colour theme (set by the creation wizard). */
  accent?: BlockAccent;
  /** Optional site fonts (catalogue names, see lib/fonts). Applied site-wide by the Design panel. */
  fontHeading?: string;
  fontBody?: string;
}

export interface HeroBlock extends Block<"hero"> {
  title: string;
  subtitle: string;
  align: "left" | "center";
}

export interface HeadingBlock extends Block<"heading"> {
  text: string;
  level: 2 | 3;
}

export interface ParagraphBlock extends Block<"paragraph"> {
  text: string;
}

export interface ImageBlock extends Block<"image"> {
  src: string;
  alt: string;
  caption: string;
}

export interface ButtonBlock extends Block<"button"> {
  label: string;
  href: string;
  variant: ButtonVariant;
}

export type DividerBlock = Block<"divider">;

export interface QuoteBlock extends Block<"quote"> {
  text: string;
  cite: string;
}

export interface ColumnsBlock extends Block<"columns"> {
  cols: Array<{
    heading: string;
    text: string;
  }>;
}

export interface CtaBlock extends Block<"cta"> {
  title: string;
  text: string;
  label: string;
  href: string;
}

export interface FaqBlock extends Block<"faq"> {
  items: Array<{ q: string; a: string }>;
}

export interface StatsBlock extends Block<"stats"> {
  items: Array<{ value: string; label: string }>;
}

export interface GalleryBlock extends Block<"gallery"> {
  images: Array<{ src: string; alt: string }>;
}

/** How a menu is laid out. All views are static HTML (no script needed). */
export type MenuView = "list" | "grid" | "compact" | "tabs";

export interface MenuItem {
  name: string;
  description: string;
  /** Free text so "85", "from 85" and "85 / 120" all work. */
  price: string;
  image: string;
  /** Short label such as "New" or "Spicy". */
  badge: string;
  available: boolean;
}

export interface MenuCategory {
  name: string;
  items: MenuItem[];
}

export interface MenuBlock extends Block<"menu"> {
  title: string;
  /** Shown after each price, e.g. "EGP" or "ج.م". */
  currency: string;
  view: MenuView;
  categories: MenuCategory[];
}

export interface FooterBlock extends Block<"footer"> {
  text: string;
}

export type AnyBlock =
  | HeroBlock
  | HeadingBlock
  | ParagraphBlock
  | ImageBlock
  | ButtonBlock
  | DividerBlock
  | QuoteBlock
  | ColumnsBlock
  | CtaBlock
  | FaqBlock
  | StatsBlock
  | GalleryBlock
  | MenuBlock
  | FooterBlock;

export const BLOCK_LABELS: Record<BlockKind, string> = {
  hero: "Hero",
  heading: "Heading",
  paragraph: "Paragraph",
  image: "Image",
  button: "Button",
  divider: "Divider",
  quote: "Quote",
  columns: "Columns",
  cta: "Call to action",
  faq: "FAQ",
  stats: "Numbers",
  gallery: "Gallery",
  menu: "Menu",
  footer: "Footer",
};

export const BLOCK_KINDS: BlockKind[] = [
  "hero",
  "heading",
  "paragraph",
  "image",
  "button",
  "divider",
  "quote",
  "columns",
  "cta",
  "faq",
  "stats",
  "gallery",
  "menu",
  "footer",
];

// ---------------------------------------------------------------------------
// Page + Site shapes mirroring the database
// ---------------------------------------------------------------------------

export interface PageDraft {
  /** Database id — absent only for template pages not yet persisted. */
  id?: string;
  key: string;
  title: string;
  path: string;
  blocks: AnyBlock[];
}

/** A page inside a whole-site immutable snapshot (reviewed by SUDO). */
export interface SnapshotPage {
  title: string;
  path: string;
  blocks: AnyBlock[];
}

/** A whole-site immutable snapshot (what SUDO reviews). */
export type SiteSnapshot = Record<string, SnapshotPage>;

/** Canonical JSON used to compute the revision content hash. */
export function canonicalJson(snapshot: SiteSnapshot): string {
  // Deterministic ordering: stable stringify via sorted keys.
  const sort = (value: unknown): unknown => {
    if (Array.isArray(value)) return value.map(sort);
    if (value !== null && typeof value === "object") {
      const out: Record<string, unknown> = {};
      for (const k of Object.keys(value as Record<string, unknown>).sort()) {
        out[k] = sort((value as Record<string, unknown>)[k]);
      }
      return out;
    }
    return value;
  };
  return JSON.stringify(sort(snapshot));
}