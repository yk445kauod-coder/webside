import { describe, expect, it } from "vitest";
import { parseBlocks } from "./schemas";
import {
  SITE_TYPES,
  buildWizardBlocks,
  defaultInput,
  wizardSchema,
  type WizardInput,
} from "./wizard";

const base = (over: Partial<WizardInput> = {}): WizardInput => ({
  ...defaultInput("business"),
  name: "Corner & Co.",
  slug: "corner-and-co",
  ...over,
});

describe("buildWizardBlocks", () => {
  it("produces blocks the server-side schema accepts, for every site type", () => {
    for (const type of SITE_TYPES) {
      const blocks = buildWizardBlocks(base({ ...defaultInput(type), name: "Test" }));
      const parsed = parseBlocks(blocks);
      expect(parsed.ok, `${type}: ${parsed.ok ? "" : parsed.error}`).toBe(true);
    }
  });

  it("starts with a hero carrying the name and ends with a footer", () => {
    const blocks = buildWizardBlocks(base());
    expect(blocks[0]).toMatchObject({ kind: "hero", title: "Corner & Co." });
    expect(blocks.at(-1)?.kind).toBe("footer");
  });

  it("gives every block a unique id", () => {
    const ids = buildWizardBlocks(base()).map((b) => b.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("respects switched-off sections", () => {
    const blocks = buildWizardBlocks(base({ sections: ["about"] }));
    const kinds = blocks.map((b) => b.kind);
    expect(kinds).not.toContain("columns");
    expect(kinds).not.toContain("quote");
    expect(kinds).not.toContain("button");
  });

  it("links the main button to the email only when it is valid", () => {
    const withEmail = buildWizardBlocks(base({ email: "hi@corner.co" })).find((b) => b.kind === "button");
    expect(withEmail).toMatchObject({ href: "mailto:hi@corner.co" });
    const bad = buildWizardBlocks(base({ email: "javascript:alert(1)" })).find((b) => b.kind === "button");
    expect(bad).toMatchObject({ href: "#contact" });
  });

  it("applies the chosen colour accent to every block", () => {
    const blocks = buildWizardBlocks(base({ accent: "sunset" }));
    expect(blocks.every((b) => b.accent === "sunset")).toBe(true);
  });

  it("drops empty offerings instead of rendering blank cards", () => {
    const blocks = buildWizardBlocks(
      base({ offerings: [{ heading: "", text: "" }, { heading: "One", text: "x" }, { heading: "", text: "" }] }),
    );
    const cols = blocks.find((b) => b.kind === "columns");
    expect(cols && "cols" in cols ? cols.cols : []).toHaveLength(1);
  });

  it("falls back to a placeholder name instead of an empty hero", () => {
    expect(buildWizardBlocks(base({ name: "   " }))[0]).toMatchObject({ title: "Your site name" });
  });
});

describe("wizardSchema", () => {
  it("accepts the default answers and rejects an empty name", () => {
    expect(wizardSchema.safeParse(base()).success).toBe(true);
    expect(wizardSchema.safeParse(base({ name: "  " })).success).toBe(false);
  });

  it("rejects unknown site types and accents", () => {
    expect(wizardSchema.safeParse({ ...base(), type: "casino" }).success).toBe(false);
    expect(wizardSchema.safeParse({ ...base(), accent: "neon" }).success).toBe(false);
  });
});

describe("restaurant menu", () => {
  it("builds a menu block (not columns) for restaurants", () => {
    const blocks = buildWizardBlocks(base({ type: "restaurant" }));
    const kinds = blocks.map((b) => b.kind);
    expect(kinds).toContain("menu");
    expect(kinds).not.toContain("columns");
  });
});

describe("smarter onboarding", () => {
  it("builds a real contact card when phone, address or hours are given", () => {
    const blocks = buildWizardBlocks(
      base({ slug: "corner", phone: "+20 100 123 4567", address: "12 Safiya Zaghloul St", hours: "cafe" }),
    );
    const contact = blocks.find((b) => b.kind === "contact");
    expect(contact).toMatchObject({
      whatsapp: "+20 100 123 4567",
      qrUrl: "https://web-side.pages.dev/corner",
    });
    expect(contact && "hours" in contact ? contact.hours.length : 0).toBe(2);
    expect(parseBlocks(blocks).ok).toBe(true);
  });

  it("keeps the simple contact text when no details are given", () => {
    const kinds = buildWizardBlocks(base({ hours: "none" })).map((b) => b.kind);
    expect(kinds).not.toContain("contact");
  });

  it("seeds a café with a priced, tabbed menu until the owner rewrites it", () => {
    const blocks = buildWizardBlocks({ ...defaultInput("restaurant"), name: "Bunn" });
    const menu = blocks.find((b) => b.kind === "menu");
    expect(menu).toMatchObject({ view: "tabs", currency: "EGP" });
    const items = menu && "categories" in menu ? menu.categories.flatMap((c) => c.items) : [];
    expect(items.length).toBeGreaterThanOrEqual(9);
    expect(items.every((i) => i.price !== "")).toBe(true);

    const input = defaultInput("restaurant");
    input.offerings[0] = { heading: "Shisha", text: "Our own blends." };
    const custom = buildWizardBlocks({ ...input, name: "Bunn" }).find((b) => b.kind === "menu");
    const first = custom && "categories" in custom ? custom.categories[0] : null;
    expect(first?.name).toBe("Shisha");
    expect(first?.items).toHaveLength(1);
  });

  it("stays valid for every site type with contact details", () => {
    for (const type of SITE_TYPES) {
      const blocks = buildWizardBlocks({ ...defaultInput(type), name: "T", phone: "01001234567", slug: "t" });
      expect(parseBlocks(blocks).ok, type).toBe(true);
    }
  });

  it("accepts old payloads without the new fields", () => {
    const { phone: _p, address: _a, hours: _h, ...old } = base();
    void _p; void _a; void _h;
    const parsed = wizardSchema.safeParse(old);
    expect(parsed.success).toBe(true);
  });
});
