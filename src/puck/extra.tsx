import type { ComponentConfig } from "@puckeditor/core";
import { MenuView } from "@/components/preview/menu-view";
import { ContactView } from "@/components/preview/contact-view";
import { safeImageSrc } from "@/lib/safe-url";
import type { ContactBlock, MenuBlock } from "@/lib/types/blocks";

const wrap = { padding: "64px 20px", maxWidth: 1100, margin: "0 auto", minWidth: 0, overflow: "hidden" } as const;
const T = (label: string) => ({ type: "text", label }) as const;
const A = (label: string) => ({ type: "textarea", label }) as const;

export type MenuProps = Omit<MenuBlock, "kind" | "style" | "id">;
export const Menu: ComponentConfig<MenuProps & { id: string }> = {
  label: "Menu / Catalog",
  fields: {
    id: { type: "text", visible: false } as never,
    title: T("Title"),
    currency: T("Currency (EGP / ج.م)"),
    view: { type: "select", label: "Layout", options: [{ label: "Tabs", value: "tabs" }, { label: "List", value: "list" }, { label: "Grid with photos", value: "grid" }, { label: "Compact", value: "compact" }] },
    categories: {
      type: "array",
      label: "Categories",
      getItemSummary: (c: { name?: string }) => c.name || "Category",
      defaultItemProps: { name: "New category", items: [] },
      arrayFields: {
        name: T("Category name"),
        items: {
          type: "array",
          label: "Items",
          getItemSummary: (i: { name?: string; price?: string }) => `${i.name || "Item"} ${i.price || ""}`.trim(),
          defaultItemProps: { name: "New item", description: "", price: "0", image: "", badge: "", available: true },
          arrayFields: {
            name: T("Name"),
            description: A("Description"),
            price: T("Price"),
            image: T("Photo link"),
            badge: T("Badge (New, Spicy…)"),
            available: { type: "radio", label: "Available", options: [{ label: "Yes", value: true }, { label: "Sold out", value: false }] },
          },
        },
      },
    },
  },
  defaultProps: {
    id: "",
    title: "Our menu",
    currency: "EGP",
    view: "tabs",
    categories: [{ name: "Favourites", items: [{ name: "House special", description: "Our best seller.", price: "85", image: "", badge: "New", available: true }] }],
  },
  render: ({ id: _id, ...p }) => {
    void _id;
    return (
      <section id="menu" style={wrap}>
        <MenuView block={{ id: "m", kind: "menu", style: "light", ...(p as MenuProps) } as MenuBlock} muted="opacity-70" />
      </section>
    );
  },
};

export type ContactProps = Omit<ContactBlock, "kind" | "style" | "id">;
export const Contact: ComponentConfig<ContactProps & { id: string }> = {
  label: "Contact & hours",
  fields: {
    id: { type: "text", visible: false } as never,
    title: T("Title"),
    phone: T("Phone"),
    whatsapp: T("WhatsApp"),
    address: T("Address"),
    mapUrl: T("Map link"),
    qrUrl: T("QR code points to"),
    hours: { type: "array", label: "Opening hours", getItemSummary: (h: { day?: string }) => h.day || "Hours", defaultItemProps: { day: "Daily", time: "9:00 – 17:00" }, arrayFields: { day: T("Days"), time: T("Time") } },
  },
  defaultProps: { id: "", title: "Visit us", phone: "", whatsapp: "", address: "", mapUrl: "", qrUrl: "", hours: [{ day: "Daily", time: "9:00 – 17:00" }] },
  render: ({ id: _id, ...p }) => {
    void _id;
    return (
      <section id="contact" style={wrap}>
        <ContactView block={{ id: "c", kind: "contact", style: "light", ...(p as ContactProps) } as ContactBlock} muted="opacity-70" />
      </section>
    );
  },
};

export const ImageBlock: ComponentConfig<{ id: string; src: string; alt: string; caption: string }> = {
  label: "Image",
  fields: { id: { type: "text", visible: false } as never, src: T("Image link"), alt: T("Describe the image"), caption: T("Caption") },
  defaultProps: { id: "", src: "", alt: "", caption: "" },
  render: ({ src, alt, caption }) => {
    const s = safeImageSrc(src);
    return (
      <figure style={{ margin: 0, padding: "24px var(--site-gutter, 24px)" }}>
        {s ? (
           
          <img src={s} alt={alt} style={{ display: "block", width: "100%", maxWidth: 960, margin: "0 auto", borderRadius: 16 }} />
        ) : (
          <div style={{ height: 220, borderRadius: 16, background: "var(--site-color-background-subtle, #f5f5f5)", display: "grid", placeItems: "center", opacity: 0.7 }}>Add an image link</div>
        )}
        {caption ? <figcaption style={{ textAlign: "center", marginTop: 8, opacity: 0.7 }}>{caption}</figcaption> : null}
      </figure>
    );
  },
};
