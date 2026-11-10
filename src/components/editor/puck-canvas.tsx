"use client";

import { useMemo } from "react";
import { Puck } from "@puckeditor/core";
import "@puckeditor/core/puck.css";
import { conf } from "@/puck";
import { toItems } from "@/puck/legacy";
import type { AnyBlock } from "@/lib/types/blocks";

/**
 * Puck (MIT) is the editor, with its own block library. Pages are stored as Puck items
 * ({type, props}); old WebSide blocks are converted on load so existing sites keep working.
 * Stored in pages.blocks, so autosave, revisions, SUDO review and publishing are unchanged.
 */
export function PuckCanvas({
  pageKey,
  blocks,
  onBlocks,
}: {
  pageKey: string;
  blocks: AnyBlock[];
  onBlocks: (blocks: AnyBlock[]) => void;
}) {
  // Only re-seed Puck when the page changes, never on our own edits.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const initial = useMemo(() => ({ root: { props: {} }, content: toItems(blocks as unknown[]) }), [pageKey]);
  return (
    <div className="ws-puck h-full min-h-0 w-full">
      <Puck
        key={pageKey}
        config={conf as never}
        data={initial as never}
        onChange={(d) => onBlocks(d.content as unknown as AnyBlock[])}
        headerPath=""
        overrides={{ header: () => <></>, headerActions: () => <></> }}
      />
    </div>
  );
}
