import { z } from "zod";
import { LIMITS } from "@/lib/limits";
import type { AnyBlock, BlockAccent, BlockStyle, PageDraft } from "@/lib/types/blocks";

// ============================================================
// The site-creation wizard's content model.
//
// The wizard collects a handful of plain answers; `buildWizardBlocks`
// turns them into the same block model the editor uses. The browser calls
// it for the live preview and the server calls it again when saving, so
// the server never trusts blocks sent by the client.
// ============================================================

export const SITE_TYPES = [
  "business",
  "portfolio",
  "shop",
  "restaurant",
  "event",
  "personal",
  "agency",
  "nonprofit",
] as const;
export type SiteType = (typeof SITE_TYPES)[number];

export const ACCENTS = ["indigo", "sunset", "forest", "ocean", "rose", "mono"] as const;
export const LOOKS = ["spotlight", "airy", "bold"] as const;
export type Look = (typeof LOOKS)[number];

export const SECTION_KEYS = ["about", "offerings", "quote", "cta", "contact"] as const;
export type SectionKey = (typeof SECTION_KEYS)[number];

export interface Offering {
  heading: string;
  text: string;
}

export interface WizardInput {
  type: SiteType;
  name: string;
  slug: string;
  tagline: string;
  about: string;
  offerings: Offering[];
  email: string;
  accent: BlockAccent;
  look: Look;
  sections: SectionKey[];
}

export interface TypePreset {
  label: string;
  hint: string;
  taglines: string[];
  aboutLabel: string;
  offeringsHeading: string;
  offerings: Offering[];
  about: string;
  quote: { text: string; cite: string };
  cta: string;
}

export const TYPE_PRESETS: Record<SiteType, TypePreset> = {
  business: {
    label: "Business",
    hint: "Services, a team, a way to reach you",
    taglines: [
      "Work that moves your business forward.",
      "Trusted by customers who expect more.",
      "Simple, reliable, done properly.",
    ],
    aboutLabel: "About us",
    offeringsHeading: "What we do",
    offerings: [
      { heading: "Consulting", text: "Clear advice from people who have done it before." },
      { heading: "Delivery", text: "We plan it, build it and hand it over finished." },
      { heading: "Support", text: "A real person answers when you need us." },
    ],
    about: "We are a small team that cares about doing the work properly. Tell us what you need and we will tell you honestly how we can help.",
    quote: { text: "They made a complicated project feel easy.", cite: "A happy client" },
    cta: "Book a call",
  },
  portfolio: {
    label: "Portfolio",
    hint: "Show your best work",
    taglines: [
      "Designer, maker and problem solver.",
      "I turn ideas into things people love.",
      "Selected work, thoughtfully made.",
    ],
    aboutLabel: "About me",
    offeringsHeading: "Selected work",
    offerings: [
      { heading: "Project one", text: "A short line about the brief, your role and the result." },
      { heading: "Project two", text: "What you made, who it was for, what changed." },
      { heading: "Project three", text: "Your favourite piece, and why it matters to you." },
    ],
    about: "I work with people who care about the details. Here is a little about how I think, what I make and what I am looking for next.",
    quote: { text: "Rare to find someone this thoughtful and this fast.", cite: "A past collaborator" },
    cta: "Work with me",
  },
  shop: {
    label: "Online shop",
    hint: "Products people can order",
    taglines: [
      "Made in small batches, shipped with care.",
      "Everyday things worth owning.",
      "Handpicked, honestly priced.",
    ],
    aboutLabel: "Our story",
    offeringsHeading: "Bestsellers",
    offerings: [
      { heading: "Signature item", text: "The one everybody comes back for. Describe it in a line." },
      { heading: "New arrival", text: "Fresh this season. What makes it special?" },
      { heading: "Gift favourite", text: "Easy to give, hard to forget." },
    ],
    about: "We started with one product and a lot of care. Every order is packed by hand and sent with a note.",
    quote: { text: "Arrived fast and exactly as pictured. Ordering again.", cite: "A verified buyer" },
    cta: "Order now",
  },
  restaurant: {
    label: "Restaurant or cafe",
    hint: "Menu, hours, where to find you",
    taglines: [
      "Good food, warm tables, no rush.",
      "Fresh every morning, from our kitchen to your table.",
      "Come hungry. Leave happy.",
    ],
    aboutLabel: "Our kitchen",
    offeringsHeading: "On the menu",
    offerings: [
      { heading: "Breakfast", text: "Baked and brewed before the doors open." },
      { heading: "Lunch", text: "Seasonal plates made with local ingredients." },
      { heading: "Dessert", text: "Something sweet to finish, made in house." },
    ],
    about: "We cook the way we eat at home: simple, generous and fresh. Drop in, grab a table and stay as long as you like.",
    quote: { text: "The best meal we have had all year.", cite: "A regular guest" },
    cta: "Reserve a table",
  },
  event: {
    label: "Event or wedding",
    hint: "Date, place, details for guests",
    taglines: [
      "Join us for a day to remember.",
      "Save the date. Bring your smile.",
      "Everything you need to know, in one place.",
    ],
    aboutLabel: "The day",
    offeringsHeading: "The plan",
    offerings: [
      { heading: "When", text: "Add the date and the time guests should arrive." },
      { heading: "Where", text: "The venue, the address and how to get there." },
      { heading: "What to know", text: "Dress code, parking and anything else guests ask." },
    ],
    about: "We are so happy you are part of this. Here is everything you need, and if anything is missing, just ask.",
    quote: { text: "Cannot wait to celebrate with you all.", cite: "The hosts" },
    cta: "RSVP",
  },
  personal: {
    label: "Personal or blog",
    hint: "Your voice, your corner of the web",
    taglines: [
      "Notes, ideas and things I am learning.",
      "A small corner of the internet that is mine.",
      "Writing about what I care about.",
    ],
    aboutLabel: "Hello",
    offeringsHeading: "What I write about",
    offerings: [
      { heading: "Ideas", text: "Things I am thinking about this month." },
      { heading: "Projects", text: "What I am building and what I learned." },
      { heading: "Reading", text: "Books and links worth your time." },
    ],
    about: "Hi, I am glad you are here. This is where I share what I am working on and what I am curious about.",
    quote: { text: "I read every post. Please keep writing.", cite: "A reader" },
    cta: "Say hello",
  },
  agency: {
    label: "Agency or studio",
    hint: "A team, a process, proof",
    taglines: [
      "A studio for brands that want to be remembered.",
      "Strategy, design and build under one roof.",
      "We make the work. You make the call.",
    ],
    aboutLabel: "The studio",
    offeringsHeading: "Services",
    offerings: [
      { heading: "Brand", text: "Identity, voice and everything that makes you recognisable." },
      { heading: "Digital", text: "Websites and products that are quick, clear and beautiful." },
      { heading: "Content", text: "Words, images and film that earn attention." },
    ],
    about: "We are a small studio with big standards. We keep teams tight, so the people you meet are the people who do the work.",
    quote: { text: "They felt like part of our team from day one.", cite: "A founder we worked with" },
    cta: "Start a project",
  },
  nonprofit: {
    label: "Nonprofit or community",
    hint: "Your cause, how people can help",
    taglines: [
      "Together we can do more.",
      "Small actions, real change.",
      "Our community, our future.",
    ],
    aboutLabel: "Our mission",
    offeringsHeading: "How you can help",
    offerings: [
      { heading: "Volunteer", text: "Give a few hours and see the difference first hand." },
      { heading: "Donate", text: "Every contribution goes straight to the work." },
      { heading: "Spread the word", text: "Tell a friend. It costs nothing and means a lot." },
    ],
    about: "We exist to make a real difference where we live. Here is what we do, why it matters and how you can be part of it.",
    quote: { text: "Because of this team, our street is a better place.", cite: "A neighbour" },
    cta: "Get involved",
  },
};

export const ACCENT_META: Record<BlockAccent, { label: string; swatch: string }> = {
  indigo: { label: "Aurora", swatch: "linear-gradient(135deg,#6d4cff,#3b82f6)" },
  sunset: { label: "Sunset", swatch: "linear-gradient(135deg,#f2603f,#ffb25e)" },
  forest: { label: "Forest", swatch: "linear-gradient(135deg,#1f8f63,#7bd389)" },
  ocean: { label: "Ocean", swatch: "linear-gradient(135deg,#1c7ed6,#4cd4e8)" },
  rose: { label: "Rose", swatch: "linear-gradient(135deg,#e0378a,#ff9ec7)" },
  mono: { label: "Mono", swatch: "linear-gradient(135deg,#1a1a1a,#8a8a8a)" },
};

export const LOOK_META: Record<Look, { label: string; hint: string }> = {
  spotlight: { label: "Spotlight", hint: "Dark, centred, dramatic" },
  airy: { label: "Airy", hint: "Light, left aligned, calm" },
  bold: { label: "Bold", hint: "Colourful and centred" },
};

export function defaultInput(type: SiteType = "business"): WizardInput {
  const p = TYPE_PRESETS[type];
  return {
    type,
    name: "",
    slug: "",
    tagline: p.taglines[0],
    about: p.about,
    offerings: p.offerings.map((o) => ({ ...o })),
    email: "",
    accent: "indigo",
    look: "spotlight",
    sections: ["about", "offerings", "quote", "cta", "contact"],
  };
}

const clip = (s: string, max: number) => s.trim().slice(0, max);
const EMAIL = /^[^\s@<>"']+@[^\s@<>"']+\.[^\s@<>"']{2,}$/;

/** Turn the wizard's answers into editor blocks. Pure and deterministic. */
export function buildWizardBlocks(input: WizardInput): AnyBlock[] {
  const preset = TYPE_PRESETS[input.type];
  const accent = input.accent;
  const name = clip(input.name, LIMITS.heroTitle) || "Your site name";
  const has = (k: SectionKey) => input.sections.includes(k);
  const email = EMAIL.test(input.email.trim()) ? input.email.trim() : "";
  const blocks: AnyBlock[] = [];
  let n = 0;
  const id = () => `w${n++}`;

  const heroStyle: BlockStyle =
    input.look === "spotlight" ? "ink" : input.look === "bold" ? "tint" : "light";
  blocks.push({
    id: id(),
    kind: "hero",
    style: heroStyle,
    accent,
    title: name,
    subtitle: clip(input.tagline, LIMITS.heroSubtitle),
    align: input.look === "airy" ? "left" : "center",
  });

  if (has("about") && input.about.trim()) {
    blocks.push({ id: id(), kind: "heading", style: "light", accent, level: 2, text: preset.aboutLabel });
    blocks.push({
      id: id(),
      kind: "paragraph",
      style: "light",
      accent,
      text: clip(input.about, LIMITS.paragraph),
    });
  }

  if (has("offerings")) {
    const cols = input.offerings
      .filter((o) => o.heading.trim() || o.text.trim())
      .slice(0, 3)
      .map((o) => ({
        heading: clip(o.heading, LIMITS.columnHeading),
        text: clip(o.text, LIMITS.columnText),
      }));
    if (cols.length > 0) {
      blocks.push({ id: id(), kind: "heading", style: "tint", accent, level: 2, text: preset.offeringsHeading });
      blocks.push({ id: id(), kind: "columns", style: "tint", accent, cols });
    }
  }

  if (has("quote")) {
    blocks.push({
      id: id(),
      kind: "quote",
      style: "light",
      accent,
      text: preset.quote.text,
      cite: preset.quote.cite,
    });
  }

  if (has("cta")) {
    blocks.push({
      id: id(),
      kind: "button",
      style: "light",
      accent,
      label: preset.cta,
      href: email ? `mailto:${email}` : "#contact",
      variant: "primary",
    });
  }

  if (has("contact")) {
    blocks.push({ id: id(), kind: "heading", style: "ink", accent, level: 2, text: "Get in touch" });
    blocks.push({
      id: id(),
      kind: "paragraph",
      style: "ink",
      accent,
      text: email
        ? `We would love to hear from you. Write to ${email} and we will get back to you soon.`
        : "We would love to hear from you. Add your email or phone number here.",
    });
  }

  blocks.push({
    id: id(),
    kind: "footer",
    style: has("contact") ? "ink" : "light",
    accent,
    text: `${name} — built with WebSide`.slice(0, LIMITS.footer),
  });

  return blocks;
}

export function buildWizardPages(input: WizardInput): PageDraft[] {
  return [{ key: "home", title: "Home", path: "/", blocks: buildWizardBlocks(input) }];
}

/** Server-side validation of the wizard payload. */
export const wizardSchema = z.object({
  type: z.enum(SITE_TYPES),
  name: z.string().trim().min(1, "Give your site a name.").max(80),
  slug: z.string().trim().max(80),
  tagline: z.string().max(LIMITS.heroSubtitle),
  about: z.string().max(LIMITS.paragraph),
  offerings: z
    .array(
      z.object({
        heading: z.string().max(LIMITS.columnHeading),
        text: z.string().max(LIMITS.columnText),
      }),
    )
    .max(3),
  email: z.string().trim().max(120),
  accent: z.enum(ACCENTS),
  look: z.enum(LOOKS),
  sections: z.array(z.enum(SECTION_KEYS)).max(SECTION_KEYS.length),
});
