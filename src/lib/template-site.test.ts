import { describe, expect, it } from "vitest";
import { TEMPLATE_CATALOG, getTemplateBlock, isTemplateKey, listSlots, makeTemplateBlock, prepareTemplate, renderTemplate } from "./template-site";
import { TEMPLATE_HTML } from "./template-html";
import { sanitizeItems } from "@/puck/sanitize";

describe("template-site", () => {
  it("catalog matches the bundled templates", () => {
    expect(Object.keys(TEMPLATE_HTML).sort()).toEqual(TEMPLATE_CATALOG.map((t) => t.key).sort());
    expect(isTemplateKey("constructor")).toBe(false);
  });

  for (const t of TEMPLATE_CATALOG) {
    it(`${t.key}: unchanged render is identical apart from the promo bar, edits apply and are escaped`, () => {
      const slots = listSlots(t.key);
      expect(slots.texts.length).toBeGreaterThan(8);
      expect(renderTemplate(t.key)).toBe(prepareTemplate(TEMPLATE_HTML[t.key]));
      expect(renderTemplate(t.key)).not.toContain("template-bar");
      expect(renderTemplate(t.key, { siteName: "My Shop" })).not.toContain('"Free HTML Templates"');
      const out = renderTemplate(t.key, { texts: { 0: "<b>X</b>" } });
      expect(out).toContain("&lt;b&gt;X&lt;/b&gt;");
      expect(out).not.toContain("<b>X</b>");
      expect(renderTemplate(t.key, {}, true)).toMatch(/data-ws-t="\d+"/);
      expect(renderTemplate(t.key, { dir: "rtl" })).toContain('dir="rtl"');
    });
  }

  it("swaps only safe image URLs", () => {
    const key = TEMPLATE_CATALOG.find((t) => listSlots(t.key).images.length > 0)?.key ?? "cafe";
    const ok = renderTemplate(key, { images: { 0: "https://example.com/a.jpg" } });
    expect(ok).toContain("https://example.com/a.jpg");
    const bad = renderTemplate(key, { images: { 0: "javascript:alert(1)" } });
    expect(bad).not.toContain("javascript:");
  });

  it("a template block survives the page sanitiser and is found again", () => {
    const block = makeTemplateBlock("cafe", { 0: "Hi" }, {}, "ltr");
    const r = sanitizeItems([block]);
    expect(r.ok).toBe(true);
    if (r.ok) expect(getTemplateBlock(r.items)?.props.texts[0]).toBe("Hi");
  });
});

