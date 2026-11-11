"use client";

import { useMemo, type ReactNode } from "react";
import { Puck, createUsePuck } from "@puckeditor/core";
import "@puckeditor/core/puck.css";
import { conf } from "@/puck";
import { toItems } from "@/puck/legacy";
import type { AnyBlock } from "@/lib/types/blocks";

const usePuck = createUsePuck();

/** On a phone, dragging a block into the page is close to impossible, so tapping a block adds it to the end of the page. */
function TapToAdd({ name, children }: { name: string; children: ReactNode }) {
  const dispatch = usePuck((s) => s.dispatch);
  const count = usePuck((s) => s.appState.data.content.length);
  return (
    <div
      className="cursor-pointer"
      onClick={() => dispatch({ type: "insert", componentType: name, destinationIndex: count, destinationZone: "root:default-zone" })}
    >
      {children}
    </div>
  );
}

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
    <div className="ws-puck absolute inset-0">
      <Puck
        key={pageKey}
        config={conf as never}
        data={initial as never}
        onChange={(d) => onBlocks(d.content as unknown as AnyBlock[])}
        headerPath=""
        overrides={{
          header: () => <></>,
          headerActions: () => <></>,
          componentItem: ({ name, children }) => <TapToAdd name={name}>{children}</TapToAdd>,
        }}
      />
    </div>
  );
}
