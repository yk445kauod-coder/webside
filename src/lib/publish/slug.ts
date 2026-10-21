// Where a customer site lives: https://<host>/<slug>/. The slug becomes a top-level
// folder in the deployed bundle, so it must never collide with an app route or a
// static file the app itself serves.

const RESERVED = new Set([
  // app routes
  "dashboard", "sudo", "login", "signup", "logout", "auth", "api", "new", "admin", "s", "app",
  // static / platform files
  "_next", "_site", "_worker", "_routes", "_headers", "icons", "sites", "public", "static", "assets",
  "sw", "manifest", "offline", "favicon", "robots", "sitemap", "well-known",
  // words that would look official
  "www", "mail", "help", "support", "billing", "pricing", "about", "contact", "terms", "privacy",
  "webside", "web-side", "root", "null", "undefined",
]);

const SLUG_RE = /^[a-z0-9](?:[a-z0-9-]{0,46}[a-z0-9])?$/;

export function isReservedSlug(slug: string): boolean {
  return RESERVED.has(slug);
}

/** Returns an error message, or null when the slug can be published. */
export function validatePublishSlug(slug: string): string | null {
  if (slug.length < 2) return "The address must be at least 2 characters.";
  if (!SLUG_RE.test(slug)) return "Use only lowercase letters, numbers and single hyphens (max 48).";
  if (slug.includes("--")) return "Use only lowercase letters, numbers and single hyphens (max 48).";
  if (isReservedSlug(slug)) return "That address is reserved. Pick another one.";
  return null;
}

/** A page path from a snapshot -> safe folder segments ("/" -> []). Null if it is not usable. */
export function pathSegments(path: string): string[] | null {
  const raw = path.trim();
  if (raw === "" || raw === "/") return [];
  if (!raw.startsWith("/")) return null;
  const parts = raw.split("/").filter(Boolean);
  if (parts.length > 3) return null;
  for (const p of parts) if (!/^[a-z0-9][a-z0-9-]{0,47}$/.test(p)) return null;
  return parts;
}
