import { describe, expect, it } from "vitest";
import { qrMatrix, qrSvg, QR_MAX_BYTES } from "./qr";

describe("qr", () => {
  it("picks the smallest version and draws finder patterns", () => {
    const m = qrMatrix("https://wa.me/201012345678")!;
    expect(m.length).toBe(25); // version 2
    // top-left finder: dark ring, light ring, dark core
    expect(m[0][0]).toBe(true);
    expect(m[1][1]).toBe(false);
    expect(m[3][3]).toBe(true);
    // timing pattern and the always-dark module
    expect(m[6][8]).toBe(true);
    expect(m[7][7]).toBe(false); // separator
    expect(m[m.length - 8][8]).toBe(true);
  });
  it("is deterministic", () => {
    expect(qrMatrix("https://example.com")).toEqual(qrMatrix("https://example.com"));
  });
  it("handles UTF-8 and the capacity limit", () => {
    expect(qrMatrix("مرحبا")).not.toBeNull();
    expect(qrMatrix("a".repeat(QR_MAX_BYTES))).not.toBeNull();
    expect(qrMatrix("a".repeat(QR_MAX_BYTES + 1))).toBeNull();
    expect(qrMatrix("")).toBeNull();
  });
  it("produces an svg path with a quiet zone", () => {
    const s = qrSvg("https://example.com")!;
    expect(s.size).toBe(25 + 8);
    expect(s.path.startsWith("M4 4h1v1h-1z")).toBe(true);
  });
});
