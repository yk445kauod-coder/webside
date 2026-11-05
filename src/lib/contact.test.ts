import { describe, expect, it } from "vitest";
import { telHref, whatsappDigits, whatsappHref } from "./contact";

describe("contact helpers", () => {
  it("turns Egyptian local numbers into international wa.me links", () => {
    expect(whatsappDigits("010 1234 5678")).toBe("201012345678");
    expect(whatsappHref("+20 101 234 5678")).toBe("https://wa.me/201012345678");
    expect(whatsappHref("00201012345678")).toBe("https://wa.me/201012345678");
  });
  it("rejects unusable numbers", () => {
    expect(whatsappHref("")).toBe("");
    expect(whatsappHref("12")).toBe("");
    expect(whatsappHref("javascript:alert(1)")).toBe("");
  });
  it("encodes a prefilled message", () => {
    expect(whatsappHref("201012345678", "مرحبا & hi")).toContain("?text=");
    expect(whatsappHref("201012345678", "a b")).toBe("https://wa.me/201012345678?text=a%20b");
  });
  it("builds tel links", () => {
    expect(telHref("+20 (10) 123-4567")).toBe("tel:+20101234567");
    expect(telHref("abc")).toBe("");
  });
});
