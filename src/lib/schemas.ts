import { z } from "zod";
import { LIMITS } from "@/lib/limits";
import { safeHref, safeImageSrc } from "@/lib/safe-url";
import type { AnyBlock } from "@/lib/types/blocks";

// ============================================================
// Server-side validation for everything the editor sends us.
// Row Level Security decides *who* may write; these schemas decide
// *what* may be written, so a tampered client can't store garbage
// (or hostile URLs) inside a block.
// ============================================================

const id = z.string().min(1).max(64);
const style = z.enum(["light", "tint", "ink"]);
const text = (max: number) => z.string().max(max);

const accent = z.enum(["indigo", "sunset", "forest", "ocean", "rose", "mono"]).optional();

const base = { id, style, accent };

const blockSchema = z.discriminatedUnion("kind", [
  z.object({
    ...base,
    kind: z.literal("hero"),
    title: text(LIMITS.heroTitle),
    subtitle: text(LIMITS.heroSubtitle),
    align: z.enum(["left", "center"]),
  }),
  z.object({
    ...base,
    kind: z.literal("heading"),
    text: text(LIMITS.heading),
    level: z.union([z.literal(2), z.literal(3)]),
  }),
  z.object({ ...base, kind: z.literal("paragraph"), text: text(LIMITS.paragraph) }),
  z.object({
    ...base,
    kind: z.literal("image"),
    src: text(LIMITS.url).transform(safeImageSrc),
    alt: text(LIMITS.alt),
    caption: text(LIMITS.caption),
  }),
  z.object({
    ...base,
    kind: z.literal("button"),
    label: text(LIMITS.buttonLabel),
    href: text(LIMITS.url).transform(safeHref),
    variant: z.enum(["primary", "secondary", "ghost"]),
  }),
  z.object({ ...base, kind: z.literal("divider") }),
  z.object({
    ...base,
    kind: z.literal("quote"),
    text: text(LIMITS.quote),
    cite: text(LIMITS.cite),
  }),
  z.object({
    ...base,
    kind: z.literal("columns"),
    cols: z
      .array(
        z.object({
          heading: text(LIMITS.columnHeading),
          text: text(LIMITS.columnText),
        }),
      )
      .min(1)
      .max(3),
  }),
  z.object({ ...base, kind: z.literal("footer"), text: text(LIMITS.footer) }),
]);

export const blocksSchema = z.array(blockSchema).max(LIMITS.blocksPerPage);

/** Validate + sanitise a page's blocks. Never throws; returns a result. */
export function parseBlocks(
  input: unknown,
): { ok: true; blocks: AnyBlock[] } | { ok: false; error: string } {
  const parsed = blocksSchema.safeParse(input);
  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    const where = issue?.path.length ? ` (${issue.path.join(".")})` : "";
    return {
      ok: false,
      error: `${issue?.message ?? "Invalid content"}${where}`,
    };
  }
  return { ok: true, blocks: parsed.data as AnyBlock[] };
}

export const uuidSchema = z.uuid();

export const pageTitleSchema = z
  .string()
  .trim()
  .min(1, "Give the page a title.")
  .max(LIMITS.pageTitle, `Keep the page title under ${LIMITS.pageTitle} characters.`);

export const noteSchema = z
  .string()
  .trim()
  .max(LIMITS.note, `Keep notes under ${LIMITS.note} characters.`);
