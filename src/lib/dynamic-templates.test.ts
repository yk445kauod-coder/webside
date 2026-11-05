import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { DYNAMIC_VERTICALS } from "./dynamic-templates";

describe("dynamic templates", () => {
  it("registry matches templates/manifest.json", () => {
    const manifest = JSON.parse(readFileSync("templates/manifest.json", "utf8"));
    expect(DYNAMIC_VERTICALS.map((v) => v.id)).toEqual(manifest.verticals);
  });
});
