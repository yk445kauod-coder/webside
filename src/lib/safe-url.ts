// ============================================================
// URL hardening for customer-authored content.
//
// Block content is written by customers but rendered to the SUDO reviewer
// (and later published), so a `javascript:` href or a hostile image source
// would be stored XSS against the admin. Everything that ends up in an
// href/src attribute goes through these helpers — both when rendering and
// when validating on the server.
// ============================================================

const LINK_PROTOCOLS = new Set(["http:", "https:", "mailto:", "tel:"]);
const IMAGE_PROTOCOLS = new Set(["http:", "https:"]);

// Browsers ignore ASCII whitespace/control characters inside the scheme
// ("java\nscript:"), so strip them before inspecting the value.
const STRIP = /[\u0000- \u007f-\u009f]/g;
const HAS_SCHEME = /^[a-z][a-z0-9+.-]*:/i;

function sanitize(input: unknown, allowed: Set<string>): string | null {
  if (typeof input !== "string") return null;
  const value = input.replace(STRIP, "");
  if (!value) return null;
  // Anchors, relative paths and protocol-relative URLs carry no scheme.
  if (!HAS_SCHEME.test(value)) return value;
  try {
    const url = new URL(value);
    return allowed.has(url.protocol) ? value : null;
  } catch {
    return null;
  }
}

/** A safe value for `<a href>`; falls back to `#` for anything unsafe. */
export function safeHref(input: unknown): string {
  return sanitize(input, LINK_PROTOCOLS) ?? "#";
}

/** A safe value for `<img src>`; falls back to an empty string. */
export function safeImageSrc(input: unknown): string {
  return sanitize(input, IMAGE_PROTOCOLS) ?? "";
}

/** True when the link leaves the page (opens in a new tab). */
export function isExternalHref(href: string): boolean {
  return /^https?:\/\//i.test(href);
}
