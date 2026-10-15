import type { PageDraft, SiteSnapshot } from "./types/blocks";

// ============================================================
// Starter templates for new sites. Zero-budget: everything is
// plain typed blocks, no external assets.
// ============================================================

export interface Template {
  key: string;
  name: string;
  blurb: string;
  accent: "cobalt" | "apricot";
  snapshot: SiteSnapshot;
}

function uid() {
  return Math.random().toString(36).slice(2, 10);
}

const blank: Template = {
  key: "blank",
  name: "Blank canvas",
  blurb: "Start empty and build from scratch.",
  accent: "cobalt",
  snapshot: {
    home: {
      title: "Home",
      path: "/",
      blocks: [
        {
          id: uid(),
          kind: "hero",
          style: "tint",
          title: "Your web. Your side.",
          subtitle:
            "A clean starting point. Use the block editor to add headings, text, images and buttons.",
          align: "center",
        },
        {
          id: uid(),
          kind: "paragraph",
          style: "light",
          text: "This is a blank canvas. Pick a block on the left to begin shaping your site.",
        },
      ],
    },
  },
};

const studio: Template = {
  key: "studio",
  name: "Studio",
  blurb: "A focused one-page portfolio for a designer or maker.",
  accent: "apricot",
  snapshot: {
    home: {
      title: "Home",
      path: "/",
      blocks: [
        {
          id: uid(),
          kind: "hero",
          style: "ink",
          title: "Mara Villas",
          subtitle:
            "Independent designer working across identity, print and the web.",
          align: "left",
        },
        {
          id: uid(),
          kind: "heading",
          style: "light",
          level: 2,
          text: "Selected work",
        },
        {
          id: uid(),
          kind: "columns",
          style: "light",
          cols: [
            {
              heading: "Field Notes",
              text: "Editorial system and typeface pairing for a quarterly journal.",
            },
            {
              heading: "Kiosk",
              text: "Identity and signage for a neighbourhood coffee counter.",
            },
            {
              heading: "Common Ground",
              text: "Wayfinding and printed matter for a community garden.",
            },
          ],
        },
        {
          id: uid(),
          kind: "quote",
          style: "tint",
          text: "Design is a conversation between the maker and the made thing.",
          cite: "Studio practice",
        },
        {
          id: uid(),
          kind: "button",
          style: "light",
          label: "Get in touch",
          href: "mailto:hello@example.com",
          variant: "primary",
        },
        {
          id: uid(),
          kind: "footer",
          style: "light",
          text: "© Mara Villas — built with WebSide",
        },
      ],
    },
  },
};

const local: Template = {
  key: "local",
  name: "Local business",
  blurb: "A home for a cafe, shop or neighbourhood service.",
  accent: "cobalt",
  snapshot: {
    home: {
      title: "Home",
      path: "/",
      blocks: [
        {
          id: uid(),
          kind: "hero",
          style: "tint",
          title: "Corner & Co.",
          subtitle: "Coffee, pastries and quiet corners in the old market district.",
          align: "left",
        },
        {
          id: uid(),
          kind: "heading",
          style: "light",
          level: 2,
          text: "What we do",
        },
        {
          id: uid(),
          kind: "paragraph",
          style: "light",
          text: "We roast in small batches, bake every morning, and keep the door open for people who need a place to think.",
        },
        {
          id: uid(),
          kind: "columns",
          style: "light",
          cols: [
            { heading: "Fresh pastries", text: "Baked before the doors open, every day." },
            { heading: "Slow coffee", text: "Batch-brewed and poured with patience." },
            { heading: "A room for you", text: "Tables, light and no rush." },
          ],
        },
        {
          id: uid(),
          kind: "button",
          style: "light",
          label: "Find us",
          href: "#contact",
          variant: "secondary",
        },
        {
          id: uid(),
          kind: "footer",
          style: "light",
          text: "Corner & Co. — Open Tuesday to Sunday",
        },
      ],
    },
  },
};

export const TEMPLATES: Template[] = [studio, local, blank];

export function getTemplate(key: string): Template {
  return TEMPLATES.find((t) => t.key === key) ?? blank;
}

/** Fresh page drafts for a new site (every block gets a unique id). */
export function blankPages(template: Template): PageDraft[] {
  return Object.entries(template.snapshot).map(([key, page]) => ({
    key,
    title: page.title,
    path: page.path,
    blocks: page.blocks.map((b) => ({ ...b, id: uid() })),
  }));
}