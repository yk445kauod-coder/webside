import type { AnyBlock } from "@/lib/types/blocks";
import { cn } from "@/lib/utils";
import { BlockView } from "./block-view";

interface PreviewCanvasProps {
  blocks: AnyBlock[];
  title?: string;
  /** Renders in a browser-chrome frame (standalone preview / SUDO review). */
  framed?: boolean;
  className?: string;
  /** When set, blocks become clickable (editor selection mode). */
  interactive?: boolean;
  selectedId?: string | null;
  onBlockClick?: (id: string) => void;
}

/**
 * Renders a page's blocks as a real HTML page — the same renderer used in
 * the editor canvas, the standalone preview and the SUDO review pane, so the
 * owner reviews exactly what the customer built.
 */
export function PreviewCanvas({
  blocks,
  title,
  framed,
  className,
  interactive,
  selectedId,
  onBlockClick,
}: PreviewCanvasProps) {
  return (
    <div
      className={cn(
        "flex max-w-full flex-col overflow-hidden bg-white",
        framed &&
          "min-h-[420px] rounded-t-xl border border-b-0 border-line shadow-sm",
        className,
      )}
    >
      {framed ? <FakeBrowserBar title={title} /> : null}
      {blocks.length === 0 ? (
        <div className="flex flex-1 items-center justify-center px-6 py-24">
          <p className="max-w-sm text-center text-sm leading-relaxed text-muted">
            This page is empty. Add a block from the left panel to begin.
          </p>
        </div>
      ) : (
        <div className="flex flex-1 flex-col">
          {blocks.map((block) => (
            <div
              key={block.id}
              onClick={
                interactive && onBlockClick
                  ? (e) => {
                      e.stopPropagation();
                      onBlockClick(block.id);
                    }
                  : undefined
              }
              className={
                interactive
                  ? cn(
                      "relative cursor-pointer ring-inset transition-shadow hover:ring-2 hover:ring-cobalt/60",
                      selectedId === block.id && "ring-2 ring-cobalt",
                    )
                  : undefined
              }
            >
              <BlockView block={block} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function FakeBrowserBar({ title }: { title?: string }) {
  return (
    <div className="flex items-center gap-3 border-b border-line bg-canvas px-4 py-2.5">
      <div className="flex gap-1.5">
        <span className="h-2.5 w-2.5 rounded-full bg-[#e5484d]" />
        <span className="h-2.5 w-2.5 rounded-full bg-[#f0b429]" />
        <span className="h-2.5 w-2.5 rounded-full bg-[#30a46c]" />
      </div>
      <div className="mx-auto hidden max-w-md flex-1 items-center justify-center gap-1 rounded-md border border-line bg-white px-3 py-1 text-xs text-muted sm:flex">
        <svg
          className="h-3 w-3 text-ink/40"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <rect x="3" y="11" width="18" height="11" rx="2" />
          <path d="M7 11V7a5 5 0 0 1 10 0v4" />
        </svg>
        <span className="truncate">{title || "preview"}</span>
      </div>
      <span className="w-6" />
    </div>
  );
}