import type { AnyBlock } from "@/lib/types/blocks";

/**
 * The landing-page product shot: a café site built from the same blocks a customer gets
 * (hero, tabbed menu, contact with WhatsApp, opening hours and a QR code).
 * It mirrors the "cafe" vertical of the dynamic template, so the demo matches what we sell.
 */
export const SHOWCASE_URL = "dar-el-bunn.webside.dev";

const it = (name: string, description: string, price: string, badge = "") => ({
  name,
  description,
  price,
  image: "",
  badge,
  available: true,
});

export function showcaseBlocks(): AnyBlock[] {
  const accent = "sunset" as const;
  return [
    {
      id: "s0",
      kind: "hero",
      style: "ink",
      accent,
      title: "Dar El Bunn Café",
      subtitle: "Specialty coffee, fresh pastries and a quiet corner in the heart of Alexandria.",
      align: "center",
    },
    {
      id: "s1",
      kind: "menu",
      style: "light",
      accent,
      title: "Our menu",
      currency: "EGP",
      view: "tabs",
      categories: [
        {
          name: "Coffee",
          items: [
            it("Espresso", "Double shot, single-origin beans.", "55"),
            it("Flat White", "Silky milk, two shots.", "85", "Popular"),
            it("Iced Spanish Latte", "Condensed milk, over ice.", "95", "New"),
            it("Turkish Coffee", "Slow-cooked on sand, cardamom optional.", "50"),
          ],
        },
        {
          name: "Cold drinks",
          items: [
            it("Fresh Orange", "Squeezed to order.", "70"),
            it("Mint Lemonade", "Fresh mint, a little sugar.", "65"),
            it("Hibiscus Iced Tea", "Karkade, lightly sweet.", "60"),
          ],
        },
        {
          name: "Bakery",
          items: [
            it("Butter Croissant", "Baked every morning.", "60"),
            it("Pistachio Roll", "Warm, with whipped cream.", "90", "Chef's pick"),
            it("Feteer Meshaltet", "Honey and cream, for sharing.", "120"),
          ],
        },
      ],
    },
    {
      id: "s2",
      kind: "contact",
      style: "tint",
      accent,
      title: "Visit or order",
      phone: "+20 100 123 4567",
      whatsapp: "+20 100 123 4567",
      address: "12 Safiya Zaghloul St, Alexandria",
      mapUrl: "https://maps.google.com/?q=Alexandria+Egypt",
      hours: [
        { day: "Sat – Thu", time: "8:00 am – 1:00 am" },
        { day: "Friday", time: "1:00 pm – 2:00 am" },
      ],
      qrUrl: `https://${SHOWCASE_URL}`,
    },
    {
      id: "s3",
      kind: "footer",
      style: "ink",
      accent,
      text: "© Dar El Bunn Café. Made with WebSide.",
    },
  ];
}
