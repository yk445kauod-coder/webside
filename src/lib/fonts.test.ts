import { describe, expect, it } from "vitest";
import { FONTS, fontCssUrl, fontStack, isFontName } from "./fonts";

describe("fonts", () => {
  it("has unique names and a large catalogue", () => {
    expect(new Set(FONTS.map((f) => f.name)).size).toBe(FONTS.length);
    expect(FONTS.length).toBeGreaterThanOrEqual(100);
  });
  it("builds safe urls and stacks only for known fonts", () => {
    expect(fontCssUrl("Open Sans")).toContain("family=Open+Sans:wght@400;700");
    expect(fontCssUrl("Pacifico")).not.toContain("wght");
    expect(fontCssUrl("evil")).toBeNull();
    expect(fontStack("Cairo")).toMatch(/^"Cairo", /);
    expect(fontStack("evil")).toBe("");
    expect(isFontName("Cairo")).toBe(true);
    expect(isFontName(42)).toBe(false);
  });
});
