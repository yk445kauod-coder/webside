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
  | "footer";

export type BlockStyle = "light" | "tint" | "ink";
export type ButtonVariant = "primary" | "secondary" | "ghost";

export interface Block<
  K extends BlockKind = BlockKind,
> {
  id: string;
  kind: K;
  style: BlockStyle;
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