import { describe, expect, it } from "vitest";
import { TEMPLATE_HTML } from "./template-html";
import { menuCount, parseBulk, sanitizeCss } from "./template-extras";
import { applyTplOps } from "./template-agent";
import { getTemplateBlock, makeTemplateBlock, prepareTemplate, renderTemplate } from "./template-site";
import { parseBlocks } from "./schemas";

const base = { id: "t", templateKey: "cafe", texts: {}, images: {}, dir: "rtl" as const };

describe("template extras", () => {
  it("no extras leaves the template byte-identical", () => {
    expect(renderTemplate("cafe")).toBe(prepareTemplate(TEMPLATE_HTML.cafe));
  });
  it("applies fonts and strips dangerous css", () => {
    const out = renderTemplate("cafe", { fonts: { heading: "Cairo", body: "Tajawal" }, css: "h1{color:red} @import url(x); </style><script>x</script>" });
    expect(out).toContain("family=Cairo");
    expect(out).toContain("h1{color:red}");
    expect(out).not.toContain("@import");
    expect(out).not.toMatch(/<script>x/);
    expect(sanitizeCss("a{")).toBe("");
    expect(renderTemplate("cafe", { fonts: { heading: "Evil;}" } as never })).not.toContain("Evil");
  });
  it("bulk-imports 400 items and renders a searchable menu that survives parseBlocks", () => {
    const text = "# قهوة\n" + Array.from({ length: 400 }, (_, i) => `صنف ${i} | ${i + 10} | وصف`).join("\n");
    const menu = parseBulk(text, { title: "المنيو", currency: "ج.م", categories: [] });
    expect(menuCount(menu)).toBe(400);
    const out = renderTemplate("cafe", { menu, dir: "rtl" });
    expect(out).toContain('id="ws-menu"');
    expect(out).toContain("صنف 399");
    const r = parseBlocks([makeTemplateBlock("cafe", {}, {}, "rtl", { menu, fonts: { body: "Cairo" } })]);
    expect(r.ok).toBe(true);
    if (r.ok) expect(menuCount(getTemplateBlock(r.blocks)?.props.menu)).toBe(400);
  });
  it("agent ops are validated", () => {
    const { props, applied } = applyTplOps(base, [
      { op: "text", i: 999, v: "x" }, { op: "text", i: 1, v: "hi" }, { op: "font", body: "Nope" },
      { op: "font", body: "Cairo" }, { op: "menu_add", name: "شاي", price: "10" }, { op: "image", i: 0, url: "javascript:1" },
    ] as never, 10, 3);
    expect(applied).toBe(3);
    expect(props.texts[1]).toBe("hi");
    expect(props.fonts?.body).toBe("Cairo");
    expect(menuCount(props.menu)).toBe(1);
  });
});
