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
| Primary | `Web` in Deep Ink `#17212B`, `Side` in Cobalt Blue `#4169E1` |
| Light-background monochrome | Entire wordmark in Deep Ink |
| Dark-background monochrome | Entire wordmark in White |
| Compact | Same wordmark, smaller — never an invented icon |

Rules: preserve proportions; never stretch, skew, rotate or add shadows; keep clear space; keep it
readable at small sizes. The favicon is a neutral text fallback — not an invented `WS` monogram.

Implemented in `src/components/wordmark.tsx`. The component renders text only, so no unverified
logo asset is ever claimed.

## 2. Colour

| Token | Value | Purpose |
| --- | --- | --- |
| `--ws-ink` | `#17212B` | Primary text and brand |
| `--ws-cobalt` | `#4169E1` | Primary action and wordmark accent |
| `--ws-apricot` | `#F3A879` | Restrained highlight |
| `--ws-white` | `#FFFFFF` | Base surface |
| `--ws-canvas` | `#F7F8FA` | Application background |
| `--ws-surface` | `#FFFFFF` | Panels and controls |
| `--ws-border` | `#E5E8EF` | Dividers and boundaries |
| `--ws-muted` | `#667085` | Secondary text |
| `--ws-success` | `#16845B` | Successful operations |
| `--ws-warning` | `#B7791F` | Warnings and attention |
| `--ws-danger` | `#C0393B` | Errors and destructive actions |
| `--ws-info` | `#4169E1` | Informational states |

Rules: cobalt is an accent, not a background for every section. Deep Ink carries hierarchy.
Apricot is used sparingly and never competes with primary actions. Editor surfaces stay neutral.
No excessive gradients, neon, glassmorphism or decorative blobs. Status is never conveyed by
colour alone — every status also carries a textual label.

All reusable colour lives in tokens defined once in `src/app/globals.css`; hex values are not
scattered through the application.

## 3. Typography

A modern, legible sans-serif with editorial character. WebSide loads two variable fonts via
`next/font/google` and exposes them as `--font-ws-sans` (UI/body) and `--font-ws-mono` (code,
slugs, URLs). Fallbacks are system sans-serif and monospace.

Editorial scale (defined as utility classes in `globals.css`):

- `.ws-display` — hero statements
- `.ws-h1` / `.ws-h2` — page and section headings
- `.ws-eyebrow` — small uppercase section labels
- `.ws-lede` — intro paragraphs

Body text is 16px minimum, line-height 1.6, and measure is capped for readability.

## 4. Space, shape, elevation

- 8px spacing rhythm.
- Radii: `6px` (sm), `10px` (default), `16px` (lg).
- Elevation is subtle and calm: a 1px hairline plus a soft low-contrast shadow. No glass.
- Focus is always visible: a 3px cobalt ring, never removed.

## 5. Motion

Restrained and purposeful. Transitions are short (≤ 300ms) and eased. All motion collapses
under `prefers-reduced-motion: reduce`.

## 6. Accessibility

- Contrast is verified for text and interactive controls.
- Focus rings are preserved everywhere.
- Status uses colour **and** a text label.
- The wordmark is decorative text, marked appropriately for assistive technology.
