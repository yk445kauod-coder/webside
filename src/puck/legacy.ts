import type { AnyBlock } from "@/lib/types/blocks";
import type { PageItem } from "./sanitize";

const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
const para = (s: string) => s.split(/\n{2,}/).filter(Boolean).map((p) => `<p>${esc(p).replace(/\n/g, "<br>")}</p>`).join("") || "<p></p>";

/** True for a stored item written by the Puck editor ({type, props}); false for old {kind} blocks. */
export function isPuckItem(b: unknown): b is PageItem {
  return !!b && typeof b === "object" && "type" in b && "props" in b && !("kind" in b);
}

/** Convert one old WebSide block to the equivalent Puck item so live sites keep rendering. */
export function legacyToItem(b: AnyBlock): PageItem {
  const id = b.id;
  switch (b.kind) {
    case "hero":
      return { type: "Hero", props: { id, layout: b.align === "center" ? "centered" : "split", background: "default", backdrop: "none", padding: "96px", title: b.title, description: para(b.subtitle), buttons: [] } };
    case "heading":
      return { type: "Heading", props: { id, text: b.text, level: b.level, size: b.level === 2 ? "xl" : "m", align: "left", layout: { padding: "8px" } } };
    case "paragraph":
    case "footer":
      return { type: "Text", props: { id, text: b.text, align: "left", size: b.kind === "footer" ? "s" : "m", color: b.kind === "footer" ? "muted" : "default" } };
    case "quote":
      return { type: "Text", props: { id, text: b.cite ? `“${b.text}” — ${b.cite}` : `“${b.text}”`, align: "center", size: "m", color: "default" } };
    case "button":
      return { type: "Button", props: { id, label: b.label, href: b.href, variant: b.variant === "ghost" ? "secondary" : b.variant } };
    case "divider":
      return { type: "Space", props: { id, size: "48px", directions: ["vertical"] } };
    case "cta":
      return { type: "CTA", props: { id, layout: "centered", background: "default", backdrop: "none", padding: "96px", title: b.title, description: b.text, buttons: [{ label: b.label, href: b.href, variant: "primary" }] } };
    case "faq":
      return { type: "FAQ", props: { id, background: "default", backdrop: "none", padding: "96px", title: "", description: "", items: b.items.map((i) => ({ question: i.q, answer: i.a })) } };
    case "stats":
      return { type: "Stats", props: { id, layout: "row", background: "default", backdrop: "none", padding: "96px", title: "", items: b.items } };
    case "columns":
      return {
        type: "FeatureGrid",
        props: {
          id, background: "default", backdrop: "none", padding: "96px", columns: Math.min(Math.max(b.cols.length, 1), 4), cardMode: "card", title: "", description: "",
          cards: b.cols.map((c, i) => ({ type: "Card", props: { id: `${id}-c${i}`, title: c.heading, description: c.text, icon: "sparkles", mode: "card" } })),
        },
      };
    case "image":
      return { type: "Image", props: { id, src: b.src, alt: b.alt, caption: b.caption } };
    case "gallery":
      return { type: "Grid", props: { id, numColumns: 3, gap: 16, items: b.images.map((im, i) => ({ type: "Image", props: { id: `${id}-g${i}`, src: im.src, alt: im.alt, caption: "" } })) } };
    case "menu":
      return { type: "Menu", props: { id, title: b.title, currency: b.currency, view: b.view, categories: b.categories } };
    case "contact":
      return { type: "Contact", props: { id, title: b.title, phone: b.phone, whatsapp: b.whatsapp, address: b.address, mapUrl: b.mapUrl, qrUrl: b.qrUrl, hours: b.hours } };
  }
}

/** Normalise a stored page (legacy, Puck, or mixed) into Puck items. */
export function toItems(blocks: unknown[]): PageItem[] {
  return blocks.map((b) => (isPuckItem(b) ? b : legacyToItem(b as AnyBlock)));
}
