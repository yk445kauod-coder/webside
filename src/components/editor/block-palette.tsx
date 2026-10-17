"use client";

import type { ReactElement } from "react";
import type { AnyBlock, BlockStyle, BlockKind } from "@/lib/types/blocks";
import { BLOCK_LABELS } from "@/lib/types/blocks";

export function uid() {
  return typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2, 12);
}

const iconPaths: Record<BlockKind, ReactElement> = {
  hero: (
    <path d="M3 3h18v18H3zM3 9h18M7 6h.01M11 6h.01M15 6h.01" />
  ),
  heading: (
    <path d="M4 5v14M10 5v14M4 12h6M14 5v14M20 7l-2 12M17 12h3" />
  ),
  paragraph: (
    <path d="M4 6h16M4 10h10M4 14h16M4 18h8" />
  ),
  image: (
    <>
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <circle cx="8.5" cy="8.5" r="1.5" />
      <path d="M21 15l-5-5L5 21" />
    </>
  ),
  button: (
    <>
      <rect x="3" y="8" width="18" height="8" rx="2" />
      <path d="M8 12h8" />
    </>
  ),
  divider: (
    <>
      <path d="M3 6h18M3 18h18M9 12h6" />
    </>
  ),
  quote: (
    <>
      <path d="M10 11H6a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h3a1 1 0 0 1 1 1v5c0 2-1.5 3.5-3.5 4M18 11h-4a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h3a1 1 0 0 1 1 1v5c0 2-1.5 3.5-3.5 4" />
    </>
  ),
  columns: (
    <>
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <path d="M9 3v18M15 3v18" />
    </>
  ),
  footer: (
    <>
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <path d="M3 15h18M8 18h8" />
    </>
  ),
};

export function createBlock(kind: BlockKind, style: BlockStyle = "light"): AnyBlock {
  const id = uid();
  switch (kind) {
    case "hero":
      return {
        id,
        kind: "hero",
        style,
        title: "A great headline",
        subtitle: "One calm sentence about what you do or who you are.",
        align: "center",
      };
    case "heading":
      return { id, kind: "heading", style, text: "A new heading", level: 2 };
    case "paragraph":
      return {
        id,
        kind: "paragraph",
        style,
        text: "Write a sentence or two here. Keep it clear, and say what matters.",
      };
    case "image":
      return { id, kind: "image", style, src: "", alt: "", caption: "" };
    case "button":
      return {
        id,
        kind: "button",
        style,
        label: "Learn more",
        href: "#",
        variant: "primary",
      };
    case "divider":
      return { id, kind: "divider", style };
    case "quote":
      return {
        id,
        kind: "quote",
        style,
        text: "A line worth remembering.",
        cite: "",
      };
    case "columns":
      return {
        id,
        kind: "columns",
        style,
        cols: [
          { heading: "Column one", text: "A short description of the first idea." },
          { heading: "Column two", text: "A short description of the second idea." },
          { heading: "Column three", text: "A short description of the third idea." },
        ],
      };
    case "footer":
      return { id, kind: "footer", style, text: "Your footer text" };
  }
}

const kinds: BlockKind[] = [
  "hero",
  "heading",
  "paragraph",
  "image",
  "button",
  "quote",
  "columns",
  "divider",
  "footer",
];

export function BlockPalette({ onAdd }: { onAdd: (kind: BlockKind) => void }) {
  return (
    <div className="grid grid-cols-2 gap-2">
      {kinds.map((kind) => (
        <button
          key={kind}
          type="button"
          onClick={() => onAdd(kind)}
          className="flex items-center gap-2.5 rounded-xl border border-line bg-white px-3 py-2.5 text-left text-sm text-ink transition-colors hover:border-cobalt/50 hover:bg-cobalt-soft/50"
        >
          <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-canvas text-ink">
            <svg
              aria-hidden="true"
              className="h-4 w-4"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.6"
            >
              {iconPaths[kind]}
            </svg>
          </span>
          <span>{BLOCK_LABELS[kind]}</span>
        </button>
      ))}
    </div>
  );
}