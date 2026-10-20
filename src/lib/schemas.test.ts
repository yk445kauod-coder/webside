import { describe, expect, it } from "vitest";
import { LIMITS } from "./limits";
import { parseBlocks } from "./schemas";
import { canonicalJson } from "./types/blocks";

const hero = {
  id: "h1",
  kind: "hero",
  style: "tint",
  title: "Hello",
  subtitle: "World",
  align: "center",
};

describe("parseBlocks", () => {
  it("accepts a valid page", () => {
    const res = parseBlocks([hero, { id: "d1", kind: "divider", style: "light" }]);
    expect(res.ok).toBe(true);
  });

  it("sanitises hostile URLs instead of storing them", () => {
    const res = parseBlocks([
      { id: "b1", kind: "button", style: "light", label: "Go", href: "javascript:alert(1)", variant: "primary" },
      { id: "i1", kind: "image", style: "light", src: "javascript:alert(1)", alt: "", caption: "" },
    ]);
    expect(res.ok).toBe(true);
    if (!res.ok) return;
    expect(res.blocks[0]).toMatchObject({ href: "#" });
    expect(res.blocks[1]).toMatchObject({ src: "" });
  });

  it("rejects unknown block kinds and bad enums", () => {
    expect(parseBlocks([{ ...hero, kind: "iframe" }]).ok).toBe(false);
    expect(parseBlocks([{ ...hero, style: "neon" }]).ok).toBe(false);
  });

  it("enforces the same limits the editor inputs advertise", () => {
    const long = { ...hero, title: "x".repeat(LIMITS.heroTitle + 1) };
    expect(parseBlocks([long]).ok).toBe(false);
    const tooMany = Array.from({ length: LIMITS.blocksPerPage + 1 }, (_, i) => ({
      id: `d${i}`,
      kind: "divider",
      style: "light",
    }));
    expect(parseBlocks(tooMany).ok).toBe(false);
  });

  it("requires 1–3 columns", () => {
    const cols = (n: number) => ({
      id: "c",
      kind: "columns",
      style: "light",
      cols: Array.from({ length: n }, () => ({ heading: "h", text: "t" })),
    });
    expect(parseBlocks([cols(0)]).ok).toBe(false);
    expect(parseBlocks([cols(3)]).ok).toBe(true);
    expect(parseBlocks([cols(4)]).ok).toBe(false);
  });

  it("rejects non-arrays", () => {
    expect(parseBlocks("nope").ok).toBe(false);
    expect(parseBlocks(null).ok).toBe(false);
  });
});

describe("canonicalJson", () => {
  it("is independent of key order, so equal content hashes equally", () => {
    const a = { home: { title: "Home", path: "/", blocks: [] } };
    const b = { home: { blocks: [], path: "/", title: "Home" } };
    expect(canonicalJson(a)).toBe(canonicalJson(b));
  });

  it("changes when content changes", () => {
    const a = { home: { title: "Home", path: "/", blocks: [] } };
    const b = { home: { title: "Home!", path: "/", blocks: [] } };
    expect(canonicalJson(a)).not.toBe(canonicalJson(b));
  });
});

describe("fonts and new blocks", () => {
  it("accepts catalogue fonts and rejects unknown ones", () => {
    const ok = parseBlocks([{ ...hero, fontHeading: "Playfair Display", fontBody: "Cairo" }]);
    expect(ok.ok).toBe(true);
    const bad = parseBlocks([{ ...hero, fontHeading: "x;}body{display:none" }]);
    expect(bad.ok).toBe(false);
  });

  it("validates cta, faq, stats and gallery", () => {
    const res = parseBlocks([
      { id: "c", kind: "cta", style: "light", title: "T", text: "x", label: "Go", href: "javascript:alert(1)" },
      { id: "f", kind: "faq", style: "light", items: [{ q: "q", a: "a" }] },
      { id: "s", kind: "stats", style: "light", items: [{ value: "1", label: "one" }] },
      { id: "g", kind: "gallery", style: "light", images: [{ src: "javascript:x", alt: "" }] },
    ]);
    expect(res.ok).toBe(true);
    if (!res.ok) return;
    expect(res.blocks[0]).toMatchObject({ href: "#" });
    expect(res.blocks[3]).toMatchObject({ images: [{ src: "" }] });
    expect(parseBlocks([{ id: "s", kind: "stats", style: "light", items: [] }]).ok).toBe(false);
  });
});
