# WebSide — Design System

«Your web. Your side.»

Canonical visual and interaction specification. Typography-first, editorial, calm, precise, premium.

## 1. Brand

WebSide is a website builder that gives people control over their own websites. The identity is
built around the word **WebSide** itself — typography, spacing, proportion and colour create
recognition. No monogram, no icon, no browser-window symbol, no abstract mark.

### Wordmark

Typography only, exact spelling and capitalisation: `WebSide`.

| Variant | Treatment |
| --- | --- |
| Primary | `Web` in Espresso Ink `#231813`, `Side` in Reddish Copper `#b5482a` |
| Light-background monochrome | Entire wordmark in Espresso Ink |
| Dark-background monochrome | Entire wordmark in White |
| Compact | Same wordmark, smaller — never an invented icon |

Rules: preserve proportions; never stretch, skew, rotate or add shadows; keep clear space; keep it
readable at small sizes. The favicon is a neutral text fallback — not an invented `WS` monogram.

Implemented in `src/components/wordmark.tsx`. The component renders text only, so no unverified
logo asset is ever claimed.

## 2. Colour — copper, orange, oxide blue

The palette comes from one material: **copper**. Fresh copper is reddish and orange; aged copper
oxidises to a blue-green patina (verdigris). WebSide uses all three states, on warm paper-like
neutrals — never cold grey, never violet/neon "AI" gradients.

| Token | Value | Purpose |
| --- | --- | --- |
| `--ws-copper` | `#b5482a` | **Reddish copper** — primary action, wordmark accent |
| `--ws-orange` | `#e8772e` | **Orange** — warmth, highlights, gradient end |
| `--ws-oxide` | `#2e7d87` | **Oxide blue** (copper patina) — secondary, info, calm contrast |
| `--ws-ink` | `#231813` | Warm espresso: text and hierarchy |
| `--ws-canvas` | `#faf6f1` | Application background (warm paper) |
| `--ws-surface` | `#ffffff` | Panels and controls |
| `--ws-border` | `#eadfd3` | Dividers and boundaries |
| `--ws-muted` | `#6f6258` | Secondary text |
| `--ws-success` / `--ws-warning` / `--ws-danger` | `#2f7d5a` / `#b7791f` / `#b3322f` | Status (always with a text label) |

Each brand colour has `-soft` (tint) and `-strong` (hover) tokens. The only gradient is
copper → orange, used sparingly on the primary call to action. Oxide blue is for balance —
links, info, secondary buttons, and the `oxide` customer accent.

Rules: copper is an accent, not a background for every section. Orange never competes with the
primary action. No glassmorphism, aurora blobs, neon glow, or purple. All colour lives in tokens in
`src/app/globals.css`; hex values are not scattered through the application.

Customer sites choose an accent per site: Copper (default), Oxide blue, Sunset, Forest, Ocean,
Rose, Mono. (The stored value `indigo` is the legacy key of the default and now means Copper.)

## 3. Typography

| Role | Font | Notes |
| --- | --- | --- |
| Arabic (all text) | **IBM Plex Sans Arabic** | 400–700; also used for Arabic headings |
| English body / UI | **IBM Plex Sans** | pairs natively with the Arabic face |
| English display headings | **Fraunces** | decorative yet readable, strong and cozy: a warm "soft-serif" with sturdy strokes |
| Code, slugs, URLs | JetBrains Mono | `--font-ws-mono` |

Loaded with `next/font/google` in `src/app/layout.tsx` as `--font-ws-sans`, `--font-ws-arabic`,
`--font-ws-display`, `--font-ws-mono`. Published customer sites load the same families from Google
Fonts and set `lang="ar" dir="rtl"` automatically when the content is mostly Arabic.
Arabic headings never use letter-spacing or the display serif.

## 4. Space, shape, elevation

- 8px spacing rhythm.
- Radii: `6px` (sm), `10px` (default), `16px` (lg).
- Elevation is subtle and calm: a 1px hairline plus a soft low-contrast shadow. No glass.
- Focus is always visible: a 3px copper ring, never removed.

## 5. Motion

Restrained and purposeful. Transitions are short (≤ 300ms) and eased. All motion collapses
under `prefers-reduced-motion: reduce`.

## 6. Accessibility

- Contrast is verified for text and interactive controls.
- Focus rings are preserved everywhere.
- Status uses colour **and** a text label.
- The wordmark is decorative text, marked appropriately for assistive technology.
