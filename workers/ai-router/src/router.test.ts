import { describe, expect, it } from "vitest";
import { fail, ok, order, type HealthMap } from "./router";

describe("ai router", () => {
  it("prefers the faster provider", () => {
    const h: HealthMap = {};
    ok(h, "a", 200); ok(h, "b", 5000);
    expect(order(["a", "b"], h, 0, () => 0.5)[0]).toBe("a");
  });
  it("skips providers that are cooling down and recovers after", () => {
    const h: HealthMap = {};
    fail(h, "a", 1000);
    expect(order(["a", "b"], h, 2000)).toEqual(["b"]);
    expect(order(["a", "b"], h, 1000 + 15_001)).toContain("a");
  });
  it("backs off longer on 429 and repeated failures", () => {
    const h: HealthMap = {};
    fail(h, "a", 0, 429);
    expect(h.a.until).toBe(60_000);
    fail(h, "a", 0, 429);
    expect(h.a.until).toBe(120_000);
  });
  it("still tries one provider when all are cooling down", () => {
    const h: HealthMap = {};
    fail(h, "a", 0); fail(h, "b", 0); fail(h, "b", 0);
    expect(order(["a", "b"], h, 1)).toEqual(["a"]);
  });
});
