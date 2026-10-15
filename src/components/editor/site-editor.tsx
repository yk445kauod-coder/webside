"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  savePageBlocks,
  createRevision,
  submitForReview,
} from "@/app/dashboard/sites/actions";
import { PreviewCanvas } from "@/components/preview/preview-canvas";
import { BlockPalette, createBlock } from "@/components/editor/block-palette";
import { BlockControls } from "@/components/editor/block-controls";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Wordmark } from "@/components/wordmark";
import { submissionStatus } from "@/lib/submission-status";
import { cn, formatDateTime } from "@/lib/utils";
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

/** Debounced autosave of the active page's blocks. */
function useAutosave(pageId: string | null, blocks: AnyBlock[]) {
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [state, setState] = useState<"idle" | "saving" | "saved" | "error">(
    "saved",
  );

  useEffect(() => {
    if (!pageId) return;
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(async () => {
      setState("saving");
      const res = await savePageBlocks(pageId, blocks);
      setState(res.ok ? "saved" : "error");
    }, 900);
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, [pageId, blocks]);

  return state;
}

export function SiteEditor({
  site,
  pages,
  submissions,
  revisions,
  publications,
}: Props) {
  // Working state
  const [tabs, setTabs] = useState<PageDraft[]>(() =>
    pages.map((p) => ({
      key: p.key,
      title: p.title,
      path: p.path,
      blocks: p.blocks,
    })),
  );
  const [activeKey, setActiveKey] = useState(pages[0]?.key ?? "home");
  const [selectedBlockId, setSelectedBlockId] = useState<string | null>(null);
  const [panel, setPanel] = useState<"pages" | "blocks" | "settings">("pages");
  const [previewOpen, setPreviewOpen] = useState(false);
  const [revisionOpen, setRevisionOpen] = useState(false);
  const [submitOpen, setSubmitOpen] = useState(false);
  const [submitNote, setSubmitNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [flash, setFlash] = useState<string | null>(null);

  const active = tabs.find((t) => t.key === activeKey) ?? tabs[0];
  const activePageRow = pages.find((p) => p.key === activeKey);

  const saveState = useAutosave(activePageRow?.id ?? null, active?.blocks ?? []);

  // Latest submission for status
  const latestSubmission = submissions[0] ?? null;
  const openSubmission = submissions.find((s) =>
    ["submitted", "under_review"].includes(s.status),
  );
  const latestPub = publications[0] ?? null;
  const latestRevision = revisions[0] ?? null;

  const updateBlock = useCallback(
    (block: AnyBlock) => {
      if (!active) return;
      setTabs((prev) =>
        prev.map((t) =>
          t.key === activeKey
            ? { ...t, blocks: t.blocks.map((b) => (b.id === block.id ? block : b)) }
            : t,
        ),
      );
    },
    [activeKey, active],
  );

  const addBlock = useCallback(
    (kind: BlockKind) => {
      if (!active) return;
      const block = createBlock(kind);
      setTabs((prev) =>
        prev.map((t) =>
          t.key === activeKey ? { ...t, blocks: [...t.blocks, block] } : t,
        ),
      );
      setSelectedBlockId(block.id);
      setPanel("blocks");
    },
    [activeKey, active],
  );

  const deleteBlock = useCallback(
    (id: string) => {
      if (!active) return;
      setTabs((prev) =>
        prev.map((t) =>
          t.key === activeKey
            ? { ...t, blocks: t.blocks.filter((b) => b.id !== id) }
            : t,
        ),
      );
      setSelectedBlockId(null);
    },
    [activeKey, active],
  );

  const moveBlock = useCallback(
    (id: string, dir: -1 | 1) => {
      if (!active) return;
      setTabs((prev) =>
        prev.map((t) => {
          if (t.key !== activeKey) return t;
          const idx = t.blocks.findIndex((b) => b.id === id);
          const to = idx + dir;
          if (idx < 0 || to < 0 || to >= t.blocks.length) return t;
          const next = [...t.blocks];
          const [b] = next.splice(idx, 1);
          next.splice(to, 0, b);
          return { ...t, blocks: next };
        }),
      );
    },
    [activeKey, active],
  );

  const showFlash = (msg: string) => {
    setFlash(msg);
    setTimeout(() => setFlash(null), 3500);
  };

  async function handleSaveRevision() {
    setBusy(true);
    const res = await createRevision(site.id);
    setBusy(false);
    if (!res.ok) {
      showFlash(res.error ?? "Something went wrong.");
      return;
    }
    setRevisionOpen(false);
    showFlash(`Version ${res.revisionNumber} saved — it's now the exact submission candidate.`);
  }

  async function handleSubmit() {
    setBusy(true);
    const res = await submitForReview(site.id, submitNote.trim() || undefined);
    setBusy(false);
    if (!res.ok) {
      showFlash(res.error ?? "Something went wrong.");
      return;
    }
    setSubmitOpen(false);
    setSubmitNote("");
    showFlash(
      `Submitted for review (version ${res.revisionNumber}). The owner reviews this exact version.`,
    );
  }

  return (
    <BoardShell
      site={site}
      saveState={saveState}
      flash={flash}
      onPreview={() => setPreviewOpen(true)}
      onRevision={() => setRevisionOpen(true)}
      onSubmit={() => {
        if (openSubmission) {
          showFlash("You already have a submission in review.");
          return;
        }
        setSubmitOpen(true);
      }}
      revisionCount={revisions.length}
      submission={latestSubmission}
      liveUrl={latestPub?.url ?? null}
      isOpenSubmission={Boolean(openSubmission)}
    >
      {/* ---- Left rail: pages / blocks ---- */}
      <Rail>
        <div className="border-b border-line px-3 pb-2 pt-3">
          <div className="flex gap-1 rounded-lg bg-ink-soft p-0.5">
            <RailTab active={panel === "pages"} onClick={() => setPanel("pages")}>
              Pages
            </RailTab>
            <RailTab active={panel === "blocks"} onClick={() => setPanel("blocks")}>
              Blocks
            </RailTab>
          </div>
        </div>

        {panel === "pages" ? (
          <div className="p-2">
            <p className="px-2 pb-2 pt-1 text-[11px] font-medium uppercase tracking-wider text-muted">
              {tabs.length} page{tabs.length === 1 ? "" : "s"}
            </p>
            <div className="flex flex-col gap-1">
              {tabs.map((t) => (
                <button
                  key={t.key}
                  onClick={() => setActiveKey(t.key)}
                  className={cn(
                    "flex items-center justify-between rounded-lg px-2.5 py-2 text-sm text-ink transition-colors",
                    t.key === activeKey ? "bg-cobalt-soft text-cobalt" : "hover:bg-ink-soft",
                  )}
                >
                  <span className="truncate">
                    {t.title || "Untitled"}
                    <span className="ml-2 font-mono text-[11px] text-muted">{t.path}</span>
                  </span>
                </button>
              ))}
            </div>
            <AddPageButton tabs={tabs} setTabs={setTabs} setActiveKey={setActiveKey} />
          </div>
        ) : (
          <div className="p-3">
            <p className="pb-2 text-[11px] font-medium uppercase tracking-wider text-muted">
              Add a block to “{active?.title || "page"}”
            </p>
            <BlockPalette onAdd={addBlock} />
          </div>
        )}
      </Rail>

      {/* ---- Canvas: live preview ---- */}
      <div className="flex min-w-0 flex-1 flex-col bg-canvas">
        <CanvasToolbar
          active={active}
          selectedId={selectedBlockId}
          onMove={moveBlock}
          onDelete={deleteBlock}
          onPreview={() => setPreviewOpen(true)}
        />
        <div className="ws-scroll flex-1 overflow-y-auto p-6">
          <PreviewCanvas
            blocks={active?.blocks ?? []}
            title={`${site.name} — ${active?.title ?? ""}`}
            interactive
            selectedId={selectedBlockId}
            onBlockClick={setSelectedBlockId}
          />
        </div>
      </div>

      {/* ---- Right rail: inspect/edit selected block ---- */}
      <aside
        className={cn(
          "hidden w-[300px] shrink-0 flex-col border-l border-line bg-surface lg:flex",
        )}
      >
        {(() => {
          const selectedBlock = selectedBlockId
            ? active?.blocks.find((b) => b.id === selectedBlockId)
            : undefined;
          return selectedBlock ? (
            <>
              <div className="border-b border-line px-4 py-3">
                <p className="text-sm font-semibold text-ink">Edit block</p>
                <p className="text-xs text-muted">{selectedBlock.kind}</p>
              </div>
              <div className="ws-scroll flex-1 overflow-y-auto p-4">
                <BlockControls
                  block={selectedBlock}
                  onChange={updateBlock}
                  onDelete={() => deleteBlock(selectedBlockId!)}
                />
              </div>
            </>
          ) : (
            <div className="flex flex-1 items-center justify-center p-6 text-center">
              <div>
                <p className="text-sm font-medium text-ink">Nothing selected</p>
                <p className="mt-1 text-xs leading-relaxed text-muted">
                  Click a block in the canvas to edit its content.
                </p>
              </div>
            </div>
          );
        })()}
      </aside>

      {/* ---- Dialogs ---- */}
      {previewOpen ? (
        <FullPreviewModal
          site={site}
          tabs={tabs}
          onClose={() => setPreviewOpen(false)}
        />
      ) : null}
      {revisionOpen ? (
        <Dialog
          title="Save a version"
          onClose={() => setRevisionOpen(false)}
          footer={
            <>
              <Button variant="outline" onClick={() => setRevisionOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleSaveRevision} loading={busy}>
                Save version
              </Button>
            </>
          }
        >
          <p className="text-sm leading-relaxed text-muted">
            Saving creates an immutable snapshot of every page, exactly as it
            is right now. You can submit this version for review, or keep it as
            a checkpoint.
          </p>
          <VersionList revisions={revisions} current={latestRevision} />
        </Dialog>
      ) : null}
      {submitOpen ? (
        <Dialog
          title="Submit for review"
          onClose={() => setSubmitOpen(false)}
          footer={
            <>
              <Button variant="outline" onClick={() => setSubmitOpen(false)}>
                Cancel
              </Button>
              <Button
                onClick={handleSubmit}
                loading={busy}
                disabled={!tabs.some((t) => t.blocks.length)}
              >
                Submit site
              </Button>
            </>
          }
        >
          <div className="flex flex-col gap-4">
            <p className="text-sm leading-relaxed text-muted">
              Submitting freezes the current version and sends it to the owner
              for review. They will review this exact version — nothing you
              change afterwards affects what they see until you submit again.
            </p>
            <label className="block">
              <span className="mb-1 block text-sm font-medium text-ink">
                Note to the reviewer{" "}
                <span className="text-xs font-normal text-muted">(optional)</span>
              </span>
              <textarea
                value={submitNote}
                onChange={(e) => setSubmitNote(e.target.value)}
                rows={3}
                className="w-full resize-y rounded-[10px] border border-line bg-white px-3 py-2 text-sm text-ink focus:outline-none focus:ring-[3px] focus:ring-cobalt/25"
                placeholder="What should they pay attention to?"
              />
            </label>
          </div>
        </Dialog>
      ) : null}
    </BoardShell>
  );
}

/* ------------------------------------------------------------------ */
/* Sub-components                                                       */
/* ------------------------------------------------------------------ */

function BoardShell({
  site,
  saveState,
  flash,
  onPreview,
  onRevision,
  onSubmit,
  revisionCount,
  submission,
  liveUrl,
  isOpenSubmission,
  children,
}: {
  site: SiteRow;
  saveState: string;
  flash: string | null;
  onPreview: () => void;
  onRevision: () => void;
  onSubmit: () => void;
  revisionCount: number;
  submission: SubmissionRow | null;
  liveUrl: string | null;
  isOpenSubmission: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="fixed inset-0 flex flex-col bg-canvas">
      {/* Top bar */}
      <header className="flex h-14 shrink-0 items-center justify-between gap-3 border-b border-line bg-surface px-4">
        <div className="flex min-w-0 items-center gap-3">
          <Link href="/dashboard" aria-label="Back to dashboard" className="text-muted hover:text-ink">
            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M15 18l-6-6 6-6" />
            </svg>
          </Link>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-ink">{site.name}</p>
            <p className="truncate font-mono text-[11px] text-muted">/{site.slug}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span
            className={cn(
              "hidden items-center gap-1.5 text-xs text-muted sm:flex",
            )}
          >
            <span
              className={cn(
                "h-1.5 w-1.5 rounded-full",
                saveState === "saving" && "bg-warning animate-pulse",
                saveState === "saved" && "bg-success",
                saveState === "error" && "bg-danger",
                saveState === "idle" && "bg-muted",
              )}
            />
            {saveState === "saving"
              ? "Saving…"
              : saveState === "saved"
                ? "Saved"
                : saveState === "error"
                  ? "Save failed"
                  : ""}
          </span>
          <Button size="sm" variant="outline" onClick={onPreview}>
            Preview
          </Button>
          <Button size="sm" variant="outline" onClick={onRevision}>
            <span className="mr-1 rounded bg-ink-soft px-1.5 text-[11px] font-semibold">
              {revisionCount}
            </span>
            Versions
          </Button>
          <Button
            size="sm"
            onClick={onSubmit}
            disabled={isOpenSubmission}
          >
            {isOpenSubmission ? "In review" : "Submit for review"}
          </Button>
        </div>
      </header>

      {flash ? (
        <div className="fixed left-1/2 top-16 z-50 -translate-x-1/2 rounded-xl border border-line bg-ink px-4 py-2.5 text-sm text-white shadow-ws">
          {flash}
        </div>
      ) : null}

      {submission || liveUrl ? (
        <StatusStrip submission={submission} liveUrl={liveUrl} />
      ) : null}

      <div className="flex min-h-0 flex-1">{children}</div>
    </div>
  );
}

function StatusStrip({
  submission,
  liveUrl,
}: {
  submission: SubmissionRow | null;
  liveUrl: string | null;
}) {
  const meta = submission ? submissionStatus(submission.status) : null;
  return (
    <div className="flex shrink-0 items-center justify-between gap-3 border-b border-line bg-canvas px-4 py-2 text-xs">
      <div className="flex items-center gap-3">
        {meta ? (
          <span className="flex items-center gap-1.5 text-ink">
            <span className={cn("h-1.5 w-1.5 rounded-full", meta.dot)} />
            <span className="font-medium">
              Status: {meta.label}
              {submission?.reviewed_at
                ? ` · ${formatDateTime(submission.reviewed_at)}`
                : ""}
            </span>
          </span>
        ) : null}
        {submission?.owner_notes ? (
          <span className="hidden text-muted md:inline">
            Owner note: “{submission.owner_notes}”
          </span>
        ) : null}
      </div>
      {liveUrl ? (
        <a
          href={liveUrl}
          target="_blank"
          rel="noreferrer"
          className="flex items-center gap-1.5 text-success hover:underline"
        >
          <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M10 13a5 5 0 0 0 7 0l3-3a5 5 0 0 0-7-7l-1.5 1.5" />
            <path d="M14 11a5 5 0 0 0-7 0l-3 3a5 5 0 0 0 7 7l1.5-1.5" />
          </svg>
          <span className="max-w-[220px] truncate font-mono">
            {liveUrl.replace(/^https?:\/\//, "")}
          </span>
        </a>
      ) : null}
    </div>
  );
}

function Rail({ children }: { children: React.ReactNode }) {
  return (
    <aside className="flex w-60 shrink-0 flex-col border-r border-line bg-surface">
      {children}
    </aside>
  );
}

function RailTab({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex-1 rounded-md px-2 py-1 text-sm font-medium transition-colors",
        active ? "bg-surface text-ink shadow-sm" : "text-muted hover:text-ink",
      )}
    >
      {children}
    </button>
  );
}

function AddPageButton({
  tabs,
  setTabs,
  setActiveKey,
}: {
  tabs: PageDraft[];
  setTabs: React.Dispatch<React.SetStateAction<PageDraft[]>>;
  setActiveKey: (k: string) => void;
}) {
  const [adding, setAdding] = useState(false);
  const [title, setTitle] = useState("");

  const add = () => {
    const slug = (title.trim() || "page")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");
    const key = `page-${slug}`;
    if (tabs.some((t) => t.key === key)) return;
    setTabs((prev) => [
      ...prev,
      { key, title: title.trim() || "New page", path: `/${slug}`, blocks: [] },
    ]);
    setActiveKey(key);
    setAdding(false);
    setTitle("");
  };

  if (!adding) {
    return (
      <button
        onClick={() => setAdding(true)}
        className="mt-2 flex items-center gap-1.5 rounded-lg border border-dashed border-line px-2.5 py-2 text-sm text-muted hover:border-cobalt/50 hover:text-cobalt"
      >
        <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M12 5v14M5 12h14" />
        </svg>
        Add page
      </button>
    );
  }

  return (
    <div className="mt-2 flex flex-col gap-2 rounded-lg border border-line bg-white p-2.5">
      <input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && add()}
        placeholder="Page title"
        autoFocus
        className="rounded-md border border-line px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-cobalt/25"
      />
      <div className="flex gap-1.5">
        <button
          onClick={add}
          className="flex-1 rounded-md bg-cobalt px-2 py-1 text-xs font-medium text-white hover:bg-[#3357c9]"
        >
          Add
        </button>
        <button
          onClick={() => setAdding(false)}
          className="rounded-md px-2 py-1 text-xs text-muted hover:bg-ink-soft"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}

function CanvasToolbar({
  active,
  onMove,
  onDelete,
  selectedId,
  onPreview,
}: {
  active?: PageDraft;
  onMove: (id: string, dir: -1 | 1) => void;
  onDelete: (id: string) => void;
  selectedId: string | null;
  onPreview: () => void;
}) {
  return (
    <div className="flex h-11 shrink-0 items-center justify-between gap-2 border-b border-line bg-surface px-4">
      <div className="flex items-center gap-1.5">
        <button
          onClick={onPreview}
          className="rounded-lg px-2.5 py-1.5 text-xs font-medium text-muted hover:bg-ink-soft hover:text-ink"
        >
          Live preview
        </button>
        {selectedId ? (
          <>
            <span className="mx-1 h-4 w-px bg-line" />
            <IconBtn title="Move up" onClick={() => onMove(selectedId, -1)}>
              <path d="M12 19V5M5 12l7-7 7 7" />
            </IconBtn>
            <IconBtn title="Move down" onClick={() => onMove(selectedId, 1)}>
              <path d="M12 5v14M5 12l7 7 7-7" />
            </IconBtn>
            <IconBtn title="Delete block" onClick={() => onDelete(selectedId)}>
              <path d="M18 6L6 18M6 6l12 12" />
            </IconBtn>
          </>
        ) : null}
      </div>
      <div className="text-xs text-muted">
        {active?.blocks.length} block{active?.blocks.length === 1 ? "" : "s"} ·{" "}
        Click a block to edit
      </div>
    </div>
  );
}

function IconBtn({
  title,
  onClick,
  children,
}: {
  title: string;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      title={title}
      aria-label={title}
      onClick={onClick}
      className="grid h-7 w-7 place-items-center rounded-lg text-muted hover:bg-ink-soft hover:text-ink"
    >
      <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        {children}
      </svg>
    </button>
  );
}

function Dialog({
  title,
  onClose,
  footer,
  children,
}: {
  title: string;
  onClose: () => void;
  footer: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 px-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
      role="dialog"
      aria-modal="true"
      aria-label={title}
    >
      <div className="w-full max-w-md rounded-2xl border border-line bg-surface p-6 shadow-ws">
        <div className="mb-4 flex items-start justify-between">
          <h2 className="ws-h2">{title}</h2>
          <button onClick={onClose} className="rounded-lg p-1.5 text-muted hover:bg-ink-soft hover:text-ink" aria-label="Close">
            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="flex flex-col gap-4">{children}</div>
        {footer ? (
          <div className="mt-6 flex justify-end gap-2">{footer}</div>
        ) : null}
      </div>
    </div>
  );
}

function VersionList({
  revisions,
  current,
}: {
  revisions: RevisionRow[];
  current?: RevisionRow;
}) {
  return (
    <div className="ws-scroll max-h-48 overflow-y-auto rounded-lg border border-line">
      {revisions.length === 0 ? (
        <p className="p-3 text-sm text-muted">No versions yet.</p>
      ) : (
        <ul>
          {revisions.map((r) => (
            <li
              key={r.id}
              className="flex items-center justify-between border-b border-line px-3 py-2 last:border-b-0"
            >
              <div>
                <p className="text-sm font-medium text-ink">
                  Version {r.number}
                  {current?.id === r.id ? (
                    <Badge tone="cobalt" className="ml-2">latest</Badge>
                  ) : null}
                </p>
                <p className="text-xs text-muted">{formatDateTime(r.created_at)}</p>
              </div>
              <span className="font-mono text-[10px] text-muted">
                {r.content_hash.slice(0, 8)}…
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function FullPreviewModal({
  site,
  tabs,
  onClose,
}: {
  site: SiteRow;
  tabs: PageDraft[];
  onClose: () => void;
}) {
  const [pageKey, setPageKey] = useState(tabs[0]?.key ?? "");
  const page = tabs.find((t) => t.key === pageKey) ?? tabs[0];
  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-canvas">
      <div className="flex h-14 shrink-0 items-center justify-between border-b border-line bg-surface px-4">
        <div className="flex items-center gap-3">
          <Wordmark compact />
          <span className="text-sm text-muted">Preview — {site.name}</span>
        </div>
        <div className="flex items-center gap-2">
          {tabs.map((t) => (
            <button
              key={t.key}
              onClick={() => setPageKey(t.key)}
              className={cn(
                "rounded-lg px-3 py-1.5 text-sm font-medium",
                t.key === page?.key
                  ? "bg-cobalt-soft text-cobalt"
                  : "text-muted hover:bg-ink-soft hover:text-ink",
              )}
            >
              {t.title}
            </button>
          ))}
        </div>
        <Button size="sm" variant="outline" onClick={onClose}>
          Close
        </Button>
      </div>
      <div className="ws-scroll flex-1 overflow-y-auto bg-canvas p-6">
        <div className="mx-auto max-w-4xl">
          <PreviewCanvas
            blocks={page?.blocks ?? []}
            title={`${site.name} — ${page?.title ?? ""}`}
            framed
          />
        </div>
      </div>
    </div>
  );
}