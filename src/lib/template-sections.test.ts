import { describe, expect, it } from "vitest";
import { TEMPLATE_HTML } from "./template-html";
import { prepareTemplate } from "./template-site";
import { applySections, listSections, normalizeTheme, themeVars } from "./template-sections";

describe("sections", () => {
  it("finds sections in every template", () => {
    for (const [k, h] of Object.entries(TEMPLATE_HTML)) expect(listSections(prepareTemplate(h)).length, k).toBeGreaterThanOrEqual(3);
  });
  it("hide only marks; reorder keeps every section exactly once", () => {
    const h = prepareTemplate(TEMPLATE_HTML.cafe);
    const n = listSections(h).length;
    const hid = applySections(h, { hidden: [1], order: [] });
    expect(hid).toContain("data-ws-hide");
    expect(hid.length).toBeGreaterThan(h.length);
    const order = Array.from({ length: n }, (_, i) => i);
    [order[2], order[3]] = [order[3], order[2]];
    const sw = applySections(h, { hidden: [], order });
    expect(sw.length).toBe(h.length + "<style>[data-ws-hide]{display:none!important}</style>".length);
    const a = listSections(h).map((s) => s.label);
    const b = listSections(sw).map((s) => s.label);
    expect(b[2]).toBe(a[3]);
    expect(b[3]).toBe(a[2]);
    expect([...b].sort()).toEqual([...a].sort());
  });
  it("ignores bad input", () => {
    const h = TEMPLATE_HTML.cafe;
    expect(applySections(h, { hidden: [999], order: [1, 1] })).toBe(h);
    expect(normalizeTheme({ "--evil": "red", [themeVars("cafe")[0].name]: "url(x)" }, "cafe")).toBeUndefined();
    expect(normalizeTheme({ [themeVars("cafe")[0].name]: "#112233" }, "cafe")).toBeTruthy();
  });
});
