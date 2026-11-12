import { describe, expect, it } from "vitest";
import { applyOps, parseReply, describePage, type Item } from "./site-agent";

const page: Item[] = [
  { type: "Hero", props: { id: "a", title: "Old title" } },
  { type: "CTA", props: { id: "b", title: "Call us" } },
];

describe("site agent", () => {
  it("sets text, adds, moves, removes and themes", () => {
    const r = applyOps(page, [
      { op: "set", index: 0, props: { title: "New" } },
      { op: "add", type: "FAQ", index: 1 },
      { op: "move", from: 2, to: 0 },
      { op: "theme", preset: "rose" },
      { op: "remove", index: 99 },
    ]);
    expect(r.applied).toBe(4);
    expect(r.items[0].type).toBe("Theme");
    expect(r.items.map((x) => x.type)).toEqual(["Theme", "CTA", "Hero", "FAQ"]);
    expect(r.items.find((x) => x.type === "Hero")?.props.title).toBe("New");
    expect(new Set(r.items.map((x) => x.props.id)).size).toBe(r.items.length);
  });
  it("rejects unknown blocks, presets and ids", () => {
    const r = applyOps(page, [{ op: "add", type: "RichText" }, { op: "theme", preset: "x" }, { op: "set", index: 0, props: { id: "hack" } }]);
    expect(r.items).toHaveLength(2);
    expect(r.items[0].props.id).toBe("a");
  });
  it("parses JSON wrapped in prose and falls back to plain text", () => {
    expect(parseReply('ok {"reply":"تم","ops":[{"op":"remove","index":0}]}').ops).toHaveLength(1);
    expect(parseReply("مرحبا").ops).toEqual([]);
  });
  it("describes the page", () => { expect(describePage(page)).toContain('0: Hero title="Old title"'); });
});
