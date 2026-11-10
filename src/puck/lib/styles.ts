/**
 * Puck's blocks ship CSS Modules. We use plain global CSS instead (same class names),
 * so the exact same stylesheet works in the editor AND in published static pages.
 */
export const styles: Record<string, string> = new Proxy(
  {},
  { get: (_t, k) => (typeof k === "string" ? k : undefined) },
);
