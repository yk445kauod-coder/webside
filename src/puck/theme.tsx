import type { ComponentConfig } from "@puckeditor/core";

/** Fixed palettes only: no free CSS, so a customer can never inject styles. */
export interface Preset { label: string; font: string; bg: string; subtle: string; inverse: string; text: string; muted: string; border: string; accent: string; onAccent: string; radius?: string }
export const PRESETS: Record<string, Preset> = {
  neutral: { label: "Neutral", font: "IBM Plex Sans Arabic", bg: "#ffffff", subtle: "#f5f5f5", inverse: "#171717", text: "#171717", muted: "#616161", border: "#e5e5e5", accent: "#171717", onAccent: "#ffffff" },
  ember: { label: "Ember (dark, saffron)", font: "El Messiri", bg: "#14110f", subtle: "#1e1914", inverse: "#0b0907", text: "#f6eedf", muted: "#b9ab94", border: "#33291f", accent: "#e8a23a", onAccent: "#14110f" },
  roast: { label: "Roast (coffee)", font: "Readex Pro", bg: "#f3efe9", subtle: "#e8e1d6", inverse: "#2a1d16", text: "#2a1d16", muted: "#6f5f53", border: "#d9cfc0", accent: "#4a2c1d", onAccent: "#f3efe9" },
  rose: { label: "Rose (sweet)", font: "Cairo", bg: "#fff7f8", subtle: "#ffe9ee", inverse: "#4a1830", text: "#3b1426", muted: "#8a5a6c", border: "#f5cfd9", accent: "#d6336c", onAccent: "#ffffff" },
  plum: { label: "Plum (beauty)", font: "Almarai", bg: "#17101c", subtle: "#21172a", inverse: "#0d0811", text: "#f5ecf7", muted: "#b9a6c1", border: "#382847", accent: "#e7b4ff", onAccent: "#17101c" },
  teal: { label: "Teal (medical)", font: "Tajawal", bg: "#f6fbfb", subtle: "#e3f3f2", inverse: "#0b3b3c", text: "#0b2f30", muted: "#4f7273", border: "#cfe6e5", accent: "#0f8b8d", onAccent: "#ffffff" },
  volt: { label: "Volt (fitness)", font: "Changa", bg: "#0b0c0e", subtle: "#15171b", inverse: "#000000", text: "#f4f5f7", muted: "#9aa0aa", border: "#262a31", accent: "#c6ff3d", onAccent: "#0b0c0e" },
  ink: { label: "Ink (shop)", font: "IBM Plex Sans Arabic", bg: "#fbfaf8", subtle: "#f0eee9", inverse: "#10243e", text: "#10243e", muted: "#5b6b80", border: "#dfdbd2", accent: "#e4572e", onAccent: "#ffffff" },
  studio: { label: "Studio (portfolio)", font: "Readex Pro", bg: "#101014", subtle: "#1a1a21", inverse: "#08080b", text: "#f2f2f5", muted: "#a0a0ae", border: "#2b2b35", accent: "#ff6b4a", onAccent: "#101014" },
};

export const themeCss = (key: string) => {
  const p = PRESETS[key] ?? PRESETS.neutral;
  const font = `"${p.font}", system-ui, sans-serif`;
  return `:root:root{--site-font-sans:${font};--site-color-background:${p.bg};--site-color-background-subtle:${p.subtle};--site-color-background-inverse:${p.inverse};--site-color-surface:${p.subtle};--site-color-text:${p.text};--site-color-text-muted:${p.muted};--site-color-text-inverse:#fff;--site-color-border:${p.border};--site-color-accent:${p.accent};--site-color-accent-hover:${p.accent};--site-color-on-accent:${p.onAccent};--site-color-accent-inverse:${p.accent};--site-color-accent-inverse-hover:${p.accent};--site-color-on-accent-inverse:${p.onAccent};color-scheme:${p.bg < "#888888" ? "dark" : "light"}}`;
};

export const Theme: ComponentConfig<{ id: string; preset: string }> = {
  label: "Colors & font",
  fields: {
    id: { type: "text", visible: false } as never,
    preset: { type: "select", label: "Look", options: Object.entries(PRESETS).map(([value, p]) => ({ value, label: p.label })) },
  },
  defaultProps: { id: "", preset: "neutral" },
  render: ({ preset }) => {
    const p = PRESETS[preset] ?? PRESETS.neutral;
    return (
      <>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="stylesheet" href={`https://fonts.googleapis.com/css2?family=${encodeURIComponent(p.font).replace(/%20/g, "+")}:wght@400;500;700;800&display=swap`} />
        <style dangerouslySetInnerHTML={{ __html: themeCss(preset) }} />
      </>
    );
  },
};
