// ============================================================
// Curated Google Fonts catalogue for customer sites.
// Names are validated against this list on the server, so a tampered
// client can't inject arbitrary CSS or URLs through a font field.
// ============================================================

export type FontCategory = "sans" | "serif" | "display" | "script" | "mono" | "arabic";

export interface FontDef {
  name: string;
  category: FontCategory;
  /** Only a regular (400) weight exists. */
  single?: boolean;
}

const f = (name: string, category: FontCategory, single = false): FontDef => ({
  name,
  category,
  ...(single ? { single } : {}),
});

export const FONTS: FontDef[] = [
  // ---- Sans ----
  f("Inter", "sans"), f("Plus Jakarta Sans", "sans"), f("Poppins", "sans"),
  f("Montserrat", "sans"), f("DM Sans", "sans"), f("Manrope", "sans"),
  f("Outfit", "sans"), f("Sora", "sans"), f("Space Grotesk", "sans"),
  f("Urbanist", "sans"), f("Lexend", "sans"), f("Figtree", "sans"),
  f("Rubik", "sans"), f("Nunito", "sans"), f("Raleway", "sans"),
  f("Work Sans", "sans"), f("Karla", "sans"), f("Mulish", "sans"),
  f("Quicksand", "sans"), f("Josefin Sans", "sans"), f("Barlow", "sans"),
  f("Archivo", "sans"), f("Cabin", "sans"), f("Heebo", "sans"),
  f("Source Sans 3", "sans"), f("IBM Plex Sans", "sans"), f("Public Sans", "sans"),
  f("Red Hat Display", "sans"), f("Albert Sans", "sans"), f("Be Vietnam Pro", "sans"),
  f("Epilogue", "sans"), f("Syne", "sans"), f("Bricolage Grotesque", "sans"),
  f("Onest", "sans"), f("Instrument Sans", "sans"), f("Open Sans", "sans"),
  f("Lato", "sans"), f("Roboto", "sans"), f("Comfortaa", "sans"),
  f("Baloo 2", "sans"), f("Fredoka", "sans"), f("Unbounded", "sans"),
  // ---- Serif ----
  f("Playfair Display", "serif"), f("Merriweather", "serif"), f("Lora", "serif"),
  f("Cormorant Garamond", "serif"), f("EB Garamond", "serif"), f("Libre Baskerville", "serif"),
  f("Crimson Pro", "serif"), f("Source Serif 4", "serif"), f("Spectral", "serif"),
  f("Noto Serif", "serif"), f("Bitter", "serif"), f("Roboto Slab", "serif"),
  f("Zilla Slab", "serif"), f("Fraunces", "serif"), f("Newsreader", "serif"),
  f("Bodoni Moda", "serif"), f("DM Serif Display", "serif", true), f("DM Serif Text", "serif", true),
  f("Young Serif", "serif", true), f("Gloock", "serif", true), f("Rozha One", "serif", true),
  f("Marcellus", "serif", true), f("Cinzel", "serif"), f("Yeseva One", "serif", true),
  // ---- Display ----
  f("Bebas Neue", "display", true), f("Anton", "display", true), f("Oswald", "display"),
  f("Abril Fatface", "display", true), f("Archivo Black", "display", true), f("Alfa Slab One", "display", true),
  f("Righteous", "display", true), f("Bangers", "display", true), f("Chewy", "display", true),
  f("Russo One", "display", true), f("Orbitron", "display"), f("Audiowide", "display", true),
  f("Big Shoulders Display", "display"), f("Teko", "display"), f("Rajdhani", "display"),
  f("Exo 2", "display"), f("Chakra Petch", "display"), f("Poiret One", "display", true),
  f("Italiana", "display", true), f("Tenor Sans", "display", true), f("Amatic SC", "display"),
  // ---- Script / handwriting ----
  f("Pacifico", "script", true), f("Lobster", "script", true), f("Dancing Script", "script"),
  f("Caveat", "script"), f("Satisfy", "script", true), f("Great Vibes", "script", true),
  f("Sacramento", "script", true), f("Shadows Into Light", "script", true), f("Permanent Marker", "script", true),
  f("Kalam", "script"), f("Patrick Hand", "script", true), f("Playpen Sans", "script"),
  // ---- Mono ----
  f("JetBrains Mono", "mono"), f("Space Mono", "mono"), f("IBM Plex Mono", "mono"),
  f("Fira Code", "mono"), f("Inconsolata", "mono"), f("Roboto Mono", "mono"),
  f("DM Mono", "mono", true),
  // ---- Arabic ----
  f("Cairo", "arabic"), f("Tajawal", "arabic"), f("Almarai", "arabic"),
  f("Noto Kufi Arabic", "arabic"), f("Changa", "arabic"), f("El Messiri", "arabic"),
  f("Reem Kufi", "arabic"), f("Readex Pro", "arabic"), f("IBM Plex Sans Arabic", "arabic"),
  f("Vazirmatn", "arabic"), f("Mada", "arabic"), f("Amiri", "arabic"),
  f("Lateef", "arabic"), f("Markazi Text", "arabic"), f("Scheherazade New", "arabic"),
  f("Aref Ruqaa", "arabic"), f("Lalezar", "arabic", true), f("Baloo Bhaijaan 2", "arabic"),
  f("Harmattan", "arabic"),
];

export const FONT_CATEGORIES: { value: FontCategory | "all"; label: string }[] = [
  { value: "all", label: "All" },
  { value: "sans", label: "Sans" },
  { value: "serif", label: "Serif" },
  { value: "display", label: "Display" },
  { value: "script", label: "Script" },
  { value: "mono", label: "Mono" },
  { value: "arabic", label: "عربي" },
];

const byName = new Map(FONTS.map((x) => [x.name, x]));

export function isFontName(name: unknown): name is string {
  return typeof name === "string" && byName.has(name);
}

const FALLBACK: Record<FontCategory, string> = {
  sans: "ui-sans-serif, system-ui, sans-serif",
  arabic: "ui-sans-serif, system-ui, sans-serif",
  serif: "ui-serif, Georgia, serif",
  display: "ui-sans-serif, system-ui, sans-serif",
  script: "cursive",
  mono: "ui-monospace, SFMono-Regular, monospace",
};

/** A CSS font-family value for a catalogue font (empty string if unknown). */
export function fontStack(name: string | undefined): string {
  const def = name ? byName.get(name) : undefined;
  return def ? `"${def.name}", ${FALLBACK[def.category]}` : "";
}

/** Google Fonts stylesheet URL for one font, one request per font so a bad weight can't break others. */
export function fontCssUrl(name: string): string | null {
  const def = byName.get(name);
  if (!def) return null;
  const family = def.name.replace(/ /g, "+");
  const weights = def.single ? "" : ":wght@400;700";
  return `https://fonts.googleapis.com/css2?family=${family}${weights}&display=swap`;
}

/** Tiny stylesheet (name glyphs only) used for the picker's live specimens. */
export function fontSpecimenUrl(name: string): string | null {
  const def = byName.get(name);
  if (!def) return null;
  const text = encodeURIComponent(`${def.name} Aa`);
  return `https://fonts.googleapis.com/css2?family=${def.name.replace(/ /g, "+")}&text=${text}&display=swap`;
}
