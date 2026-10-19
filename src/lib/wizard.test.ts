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
