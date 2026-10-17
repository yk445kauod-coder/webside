import { describe, expect, it } from "vitest";
import { isExternalHref, safeHref, safeImageSrc } from "./safe-url";

describe("safeHref", () => {
  it.each([
    ["https://example.com/a?b=1", "https://example.com/a?b=1"],
    ["http://example.com", "http://example.com"],
    ["mailto:hello@example.com", "mailto:hello@example.com"],
    ["tel:+201000000000", "tel:+201000000000"],
    ["#contact", "#contact"],
    ["/pricing", "/pricing"],
  ])("keeps %s", (input, expected) => {
    expect(safeHref(input)).toBe(expected);
  });

  it.each([
    "javascript:alert(1)",
    "JaVaScRiPt:alert(1)",
    "  javascript:alert(1)",
    "java\nscript:alert(1)",
    "java\tscript:alert(1)",
    "data:text/html,<script>alert(1)</script>",
    "vbscript:msgbox(1)",
    "file:///etc/passwd",
  ])("neutralises %j", (input) => {
    expect(safeHref(input)).toBe("#");
  });

  it("falls back to # for empty or non-string input", () => {
    expect(safeHref("")).toBe("#");
    expect(safeHref(undefined)).toBe("#");
    expect(safeHref(42)).toBe("#");
  });
});

describe("safeImageSrc", () => {
  it("allows http(s) images", () => {
    expect(safeImageSrc("https://cdn.example.com/a.png")).toBe("https://cdn.example.com/a.png");
  });

  it("rejects script-capable and non-web schemes", () => {
    expect(safeImageSrc("javascript:alert(1)")).toBe("");
    expect(safeImageSrc("data:image/svg+xml,<svg onload=alert(1)>")).toBe("");
    expect(safeImageSrc("mailto:a@b.co")).toBe("");
  });
});

describe("isExternalHref", () => {
  it("detects links that leave the page", () => {
    expect(isExternalHref("https://example.com")).toBe(true);
    expect(isExternalHref("HTTP://example.com")).toBe(true);
    expect(isExternalHref("#top")).toBe(false);
    expect(isExternalHref("mailto:a@b.co")).toBe(false);
  });
});
