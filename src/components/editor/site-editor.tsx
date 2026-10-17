"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  createPage,
  createRevision,
  deletePage,
  submitForReview,
} from "@/app/dashboard/sites/actions";
import { BlockControls } from "@/components/editor/block-controls";
import { BlockPalette, createBlock, uid } from "@/components/editor/block-palette";
import {
  CanvasToolbar,
  EditorTopBar,
  FullPreviewModal,
  PageList,
  RailTabs,
  StatusStrip,
  VersionList,
} from "@/components/editor/editor-parts";
import { useAutosave } from "@/components/editor/use-autosave";
import { PreviewCanvas } from "@/components/preview/preview-canvas";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Field } from "@/components/ui/field";
import { isOpenStatus } from "@/lib/submission-status";
import { LIMITS } from "@/lib/limits";
import { cn } from "@/lib/utils";
import type { AnyBlock, BlockKind, PageDraft } from "@/lib/types/blocks";
import type {
  PageRow,
  PublicationRow,
  RevisionRow,
  SiteRow,
  SubmissionRow,
} from "@/lib/types/database";

interface Props {
  site: SiteRow;
  pages: PageRow[];
  submissions: SubmissionRow[];
  revisions: RevisionRow[];
  publications: PublicationRow[];
}

type Dialogs = "none" | "preview" | "versions" | "submit" | "delete-page";

export function SiteEditor({ site, pages, submissions, revisions, publications }: Props) {
  const [tabs, setTabs] = useState<PageDraft[]>(() =>
    pages.map((p) => ({ id: p.id, key: p.key, title: p.title, path: p.path, blocks: p.blocks })),
  );
  const [activeKey, setActiveKey] = useState(pages[0]?.key ?? "");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [panel, setPanel] = useState<"pages" | "blocks">("pages");
  const [railOpen, setRailOpen] = useState(false);
  const [dialog, setDialog] = useState<Dialogs>("none");
  const [pendingDelete, setPendingDelete] = useState<string | null>(null);
  const [submitNote, setSubmitNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [dialogError, setDialogError] = useState<string | null>(null);
  const [flash, setFlash] = useState<string | null>(null);
  const flashTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const { state: saveState, error: saveError, flush, markSaved } = useAutosave(tabs);

  const active = tabs.find((t) => t.key === activeKey) ?? tabs[0];
  const blocks = active?.blocks ?? [];
  const selectedIndex = selectedId ? blocks.findIndex((b) => b.id === selectedId) : -1;
  const selectedBlock = selectedIndex >= 0 ? blocks[selectedIndex] : undefined;

  const latestSubmission = submissions[0] ?? null;
  const hasOpenSubmission = submissions.some((s) => isOpenStatus(s.status));
  const liveUrl = publications[0]?.url ?? null;

  useEffect(
    () => () => {
      if (flashTimer.current) clearTimeout(flashTimer.current);
    },
    [],
  );

  const showFlash = useCallback((message: string) => {
    setFlash(message);
    if (flashTimer.current) clearTimeout(flashTimer.current);
    flashTimer.current = setTimeout(() => setFlash(null), 4500);
  }, []);

  /** Apply a change to the active page's blocks. */
  const patchBlocks = useCallback(
    (fn: (blocks: AnyBlock[]) => AnyBlock[]) => {
      setTabs((prev) =>
        prev.map((t) => (t.key === activeKey ? { ...t, blocks: fn(t.blocks) } : t)),
      );
    },
    [activeKey],
  );

  const updateBlock = (block: AnyBlock) =>
    patchBlocks((list) => list.map((b) => (b.id === block.id ? block : b)));

  const addBlock = (kind: BlockKind) => {
    // Insert after the selected block so new content lands where you're working.
    const block = createBlock(kind);
    patchBlocks((list) => {
      const at = selectedId ? list.findIndex((b) => b.id === selectedId) : -1;
      if (at < 0) return [...list, block];
      const next = [...list];
      next.splice(at + 1, 0, block);
      return next;
    });
    setSelectedId(block.id);
    setRailOpen(false);
  };

  const deleteBlock = () => {
    if (!selectedId) return;
    const id = selectedId;
    patchBlocks((list) => list.filter((b) => b.id !== id));
    setSelectedId(null);
  };

  const duplicateBlock = () => {
    if (!selectedBlock) return;
    const copy = { ...selectedBlock, id: uid() } as AnyBlock;
    patchBlocks((list) => {
      const at = list.findIndex((b) => b.id === selectedBlock.id);
      const next = [...list];
      next.splice(at + 1, 0, copy);
      return next;
    });
    setSelectedId(copy.id);
  };

  const moveBlock = (dir: -1 | 1) => {
    if (!selectedId) return;
    const id = selectedId;
    patchBlocks((list) => {
      const from = list.findIndex((b) => b.id === id);
      const to = from + dir;
      if (from < 0 || to < 0 || to >= list.length) return list;
      const next = [...list];
      [next[from], next[to]] = [next[to], next[from]];
      return next;
    });
  };

  const selectPage = (key: string) => {
    setActiveKey(key);
    setSelectedId(null);
    setRailOpen(false);
  };

  /** Returns an error message, or null on success. */
  async function addPage(title: string): Promise<string | null> {
    const res = await createPage(site.id, title);
    if (!res.ok || !res.page) return res.error ?? "Couldn't add the page.";
    const page = res.page;
    markSaved(page.id, page.blocks);
    setTabs((prev) => [
      ...prev,
      { id: page.id, key: page.key, title: page.title, path: page.path, blocks: page.blocks },
    ]);
    selectPage(page.key);
    return null;
  }

  async function confirmDeletePage() {
    const target = tabs.find((t) => t.key === pendingDelete);
    if (!target?.id) return;
    setBusy(true);
    const res = await deletePage(target.id);
    setBusy(false);
    if (!res.ok) {
      setDialogError(res.error ?? "Couldn't delete the page.");
      return;
    }
    setTabs((prev) => prev.filter((t) => t.key !== target.key));
    if (activeKey === target.key) selectPage(tabs.find((t) => t.path === "/")?.key ?? tabs[0].key);
    closeDialog();
    showFlash(`Deleted “${target.title}”.`);
  }

  function openDialog(next: Dialogs) {
    setDialogError(null);
    setDialog(next);
  }
  const closeDialog = useCallback(() => {
    setDialog("none");
    setPendingDelete(null);
    setDialogError(null);
  }, []);

  async function handleSaveVersion() {
    setBusy(true);
    setDialogError(null);
    // Snapshots are read from the database, so make sure it is current first.
    if (!(await flush())) {
      setBusy(false);
      setDialogError("Your latest changes couldn't be saved yet. Try again in a moment.");
      return;
    }
    const res = await createRevision(site.id);
    setBusy(false);
    if (!res.ok) {
      setDialogError(res.error ?? "Something went wrong.");
      return;
    }
    closeDialog();
    showFlash(
      res.unchanged
        ? `No changes since version ${res.revisionNumber} — nothing new to save.`
        : `Version ${res.revisionNumber} saved.`,
    );
  }

  async function handleSubmit() {
    setBusy(true);
    setDialogError(null);
    if (!(await flush())) {
      setBusy(false);
      setDialogError("Your latest changes couldn't be saved yet. Try again in a moment.");
      return;
    }
    const res = await submitForReview(site.id, submitNote);
    setBusy(false);
    if (!res.ok) {
      setDialogError(res.error ?? "Something went wrong.");
      return;
    }
    closeDialog();
    setSubmitNote("");
    showFlash(`Submitted version ${res.revisionNumber} for review. The owner reviews exactly this version.`);
  }

  const hasContent = tabs.some((t) => t.blocks.length > 0);

  const inspector = selectedBlock ? (
    <>
      <div className="flex items-start justify-between gap-3 border-b border-line px-4 py-3">
        <div>
          <p className="text-sm font-semibold text-ink">Edit block</p>
          <p className="text-xs capitalize text-muted">{selectedBlock.kind}</p>
        </div>
        <button
          type="button"
          onClick={() => setSelectedId(null)}
          aria-label="Deselect block"
          className="rounded-lg p-1 text-muted hover:bg-ink-soft hover:text-ink lg:hidden"
        >
          <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
            <path d="M18 6 6 18M6 6l12 12" />
          </svg>
        </button>
      </div>
      <div className="ws-scroll flex-1 overflow-y-auto p-4">
        <BlockControls
          // Remount per block so uncontrolled bits (scroll, focus) reset cleanly.
          key={selectedBlock.id}
          block={selectedBlock}
          onChange={updateBlock}
          onDelete={deleteBlock}
          onDuplicate={duplicateBlock}
        />
      </div>
    </>
  ) : null;

  if (!active) {
    return (
      <div className="grid min-h-screen place-items-center p-6 text-center text-sm text-muted">
        This site has no pages. Go back and create the site again.
      </div>
    );
  }

  return (
    <div className="fixed inset-0 flex flex-col bg-canvas">
      <EditorTopBar
        site={site}
        saveState={saveState}
        saveError={saveError}
        onRetrySave={() => void flush()}
        onToggleRail={() => setRailOpen((o) => !o)}
        onPreview={() => openDialog("preview")}
        onRevision={() => openDialog("versions")}
        onSubmit={() => {
          if (hasOpenSubmission) {
            showFlash("You already have a submission in review.");
            return;
          }
          openDialog("submit");
        }}
        revisionCount={revisions.length}
        isOpenSubmission={hasOpenSubmission}
      />

      <div role="status" aria-live="polite" className="pointer-events-none fixed inset-x-0 top-16 z-[60] flex justify-center px-4">
        {flash ? (
          <p className="pointer-events-auto max-w-md rounded-xl border border-line bg-ink px-4 py-2.5 text-sm text-white shadow-ws">
            {flash}
          </p>
        ) : null}
      </div>

      {latestSubmission || liveUrl ? (
        <StatusStrip submission={latestSubmission} liveUrl={liveUrl} />
      ) : null}

      <div className="relative flex min-h-0 flex-1">
        {/* Backdrop for the drawer on small screens */}
        {railOpen ? (
          <button
            type="button"
            aria-label="Close panel"
            onClick={() => setRailOpen(false)}
            className="fixed inset-0 z-20 bg-ink/30 lg:hidden"
          />
        ) : null}

        {/* ---- Left rail: pages / blocks (drawer below lg) ---- */}
        <aside
          className={cn(
            "w-64 shrink-0 flex-col border-r border-line bg-surface",
            railOpen
              ? "fixed bottom-0 left-0 top-14 z-30 flex shadow-ws lg:static lg:shadow-none"
              : "hidden lg:flex",
          )}
        >
          <RailTabs value={panel} onChange={setPanel} />
          <div className="ws-scroll min-h-0 flex-1 overflow-y-auto">
            {panel === "pages" ? (
              <PageList
                tabs={tabs}
                activeKey={active.key}
                onSelect={selectPage}
                onAdd={addPage}
                onDelete={(key) => {
                  setPendingDelete(key);
                  openDialog("delete-page");
                }}
              />
            ) : (
              <div className="p-3">
                <p className="pb-2 text-[11px] font-medium uppercase tracking-wider text-muted">
                  Add to “{active.title || "page"}”
                  {selectedId ? " — after the selected block" : ""}
                </p>
                <BlockPalette onAdd={addBlock} />
                {blocks.length >= LIMITS.blocksPerPage ? (
                  <p className="mt-2 text-xs text-danger">This page has reached the block limit.</p>
                ) : null}
              </div>
            )}
          </div>
        </aside>

        {/* ---- Canvas ---- */}
        <div className="flex min-w-0 flex-1 flex-col bg-canvas">
          <CanvasToolbar
            blockCount={blocks.length}
            selectedIndex={selectedIndex}
            onMove={moveBlock}
            onDuplicate={duplicateBlock}
            onDelete={deleteBlock}
          />
          <div className="ws-scroll flex-1 overflow-y-auto p-3 sm:p-6" onClick={() => setSelectedId(null)}>
            <PreviewCanvas
              blocks={blocks}
              title={`${site.name} — ${active.title}`}
              interactive
              selectedId={selectedId}
              onBlockClick={(id) => {
                setSelectedId(id);
              }}
              emptyHint="This page is empty. Open the menu and choose “Blocks” to add your first one."
              className="mx-auto max-w-4xl rounded-xl border border-line shadow-ws-sm"
            />
          </div>
        </div>

        {/* ---- Right rail (desktop inspector) ---- */}
        <aside className="hidden w-[300px] shrink-0 flex-col border-l border-line bg-surface lg:flex">
          {inspector ?? (
            <div className="flex flex-1 items-center justify-center p-6 text-center">
              <div>
                <p className="text-sm font-medium text-ink">Nothing selected</p>
                <p className="mt-1 text-xs leading-relaxed text-muted">
                  Click a block in the canvas to edit its content.
                </p>
              </div>
            </div>
          )}
        </aside>
      </div>

      {/* ---- Inspector as a bottom sheet on small screens ---- */}
      {inspector ? (
        <div className="ws-sheet fixed inset-x-0 bottom-0 z-30 flex max-h-[65dvh] flex-col rounded-t-2xl border-t border-line bg-surface shadow-ws lg:hidden">
          {inspector}
        </div>
      ) : null}

      {/* ---- Dialogs ---- */}
      {dialog === "preview" ? (
        <FullPreviewModal site={site} tabs={tabs} onClose={closeDialog} />
      ) : null}

      {dialog === "versions" ? (
        <Dialog
          title="Save a version"
          onClose={closeDialog}
          footer={
            <>
              <Button variant="outline" onClick={closeDialog}>
                Cancel
              </Button>
              <Button onClick={handleSaveVersion} loading={busy}>
                Save version
              </Button>
            </>
          }
        >
          <p className="text-sm leading-relaxed text-muted">
            Saving creates an immutable snapshot of every page exactly as it is right now. Submit
            it for review later, or keep it as a checkpoint.
          </p>
          <VersionList revisions={revisions} />
          <DialogError message={dialogError} />
        </Dialog>
      ) : null}

      {dialog === "submit" ? (
        <Dialog
          title="Submit for review"
          onClose={closeDialog}
          footer={
            <>
              <Button variant="outline" onClick={closeDialog}>
                Cancel
              </Button>
              <Button onClick={handleSubmit} loading={busy} disabled={!hasContent}>
                Submit site
              </Button>
            </>
          }
        >
          <p className="text-sm leading-relaxed text-muted">
            Submitting freezes the current version and sends it to the owner. They review this exact
            version — later edits don&apos;t change what they see until you submit again.
          </p>
          {!hasContent ? (
            <p className="rounded-lg bg-warning-soft px-3 py-2 text-sm text-warning">
              Add some content before submitting.
            </p>
          ) : null}
          <Field
            textarea
            autoFocus
            label="Note to the reviewer"
            hint="Optional"
            placeholder="What should they pay attention to?"
            value={submitNote}
            maxLength={LIMITS.note}
            onChange={setSubmitNote}
          />
          <DialogError message={dialogError} />
        </Dialog>
      ) : null}

      {dialog === "delete-page" ? (
        <Dialog
          title="Delete this page?"
          onClose={closeDialog}
          footer={
            <>
              <Button variant="outline" onClick={closeDialog} data-autofocus="">
                Keep page
              </Button>
              <Button variant="danger" onClick={confirmDeletePage} loading={busy}>
                Delete page
              </Button>
            </>
          }
        >
          <p className="text-sm leading-relaxed text-muted">
            “{tabs.find((t) => t.key === pendingDelete)?.title}” and all of its blocks will be
            removed from your working copy. Saved versions keep their own copy.
          </p>
          <DialogError message={dialogError} />
        </Dialog>
      ) : null}
    </div>
  );
}

function DialogError({ message }: { message: string | null }) {
  if (!message) return null;
  return (
    <p role="alert" className="rounded-lg bg-danger-soft px-3 py-2 text-sm text-danger">
      {message}
    </p>
  );
}
