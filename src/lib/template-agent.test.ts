import { describe, expect, it } from "vitest";
import { applyTplOps, templatePrompt, type TplOp } from "./template-agent";
import { listSlots, renderTemplate, type TemplateProps } from "./template-site";
import { themeVars } from "./template-sections";

const base = (): TemplateProps => ({ id: "t", templateKey: "cafe", texts: {}, images: {}, dir: "rtl" });
const n = listSlots("cafe");

describe("template agent", () => {
  it("prompt exposes sections and colour variables", () => {
    const p = templatePrompt(n.texts, base());
    expect(p).toContain("section#menu-sec");
    expect(p).toContain(themeVars("cafe")[0].name + "=");
  });
  it("changes colours, hides and moves sections, rejects junk", () => {
    const v = themeVars("cafe")[0].name;
    const ops = [
      { op: "theme", vars: { [v]: "#101010", "--hack": "red" } },
      { op: "section", i: 3, action: "hide" },
      { op: "section", i: 2, action: "down" },
      { op: "section", i: 99, action: "hide" },
      { op: "section", i: 1, action: "explode" },
    ] as unknown as TplOp[];
    const r = applyTplOps(base(), ops, n.texts.length, n.images.length);
    expect(r.applied).toBe(3);
    expect(r.props.theme).toEqual({ [v]: "#101010" });
    expect(r.props.sections?.hidden).toEqual([3]);
    const html = renderTemplate("cafe", r.props);
    expect(html).toContain(`:root{${v}:#101010}`);
    expect(html).toContain("data-ws-hide");
  });
  it("hiding is reversible", () => {
    const hid = applyTplOps(base(), [{ op: "section", i: 3, action: "hide" }], 9, 9).props;
    const shown = applyTplOps(hid, [{ op: "section", i: 3, action: "show" }], 9, 9).props;
    expect(shown.sections).toBeUndefined();
  });
});
