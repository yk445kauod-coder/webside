// @vitest-environment node
import { describe, expect, it } from "vitest";
import { STATIC_TEMPLATES } from "./templates";
import { sanitizeItems, sanitizeHtml } from "./sanitize";
import { renderSite } from "@/lib/publish/render";

describe("static templates", () => {
  it("has the 8 templates, each with a unique key", () => {
    expect(STATIC_TEMPLATES).toHaveLength(8);
    expect(new Set(STATIC_TEMPLATES.map((t) => t.key)).size).toBe(8);
  });
  for (const t of STATIC_TEMPLATES) {
    it(`${t.key}: survives sanitising and publishes to HTML with real photos`, () => {
      const items = t.pages[0].items;
      const r = sanitizeItems(items);
      expect(r.ok && r.items.length).toBe(items.length);
      const out = renderSite("demo", t.nameAr, { home: { title: "Home", path: "/", blocks: items as never } });
      expect("files" in out).toBe(true);
      if ("files" in out) {
        expect(out.files[0].content).toContain("images.unsplash.com");
        expect(out.files[0].content).not.toContain("javascript:");
      }
    });
  }
  it("drops unknown blocks and unsafe links", () => {
    const r = sanitizeItems([
      { type: "RichText", props: { id: "a" } },
      { type: "Button", props: { id: "b", label: "x", href: "javascript:alert(1)" } },
    ]);
    expect(r.ok && r.items).toHaveLength(1);
    expect(r.ok && (r.items[0].props.href as string)).toBe("#");
    expect(sanitizeHtml('<p onclick="x">a</p><script>x</script>')).toBe("<p>a</p>");
  });
});
