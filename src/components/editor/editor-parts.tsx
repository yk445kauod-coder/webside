"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { PreviewCanvas } from "@/components/preview/preview-canvas";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Wordmark } from "@/components/wordmark";
import { submissionStatus } from "@/lib/submission-status";
import { cn, formatDateTime } from "@/lib/utils";
import type { PageDraft } from "@/lib/types/blocks";
import type { RevisionRow, SiteRow, SubmissionRow } from "@/lib/types/database";
import type { SaveState } from "./use-autosave";

/* ------------------------------------------------------------------ */
/* Top bar + status strip                                               */
/* ------------------------------------------------------------------ */

export function EditorTopBar({
  site,
  saveState,
  saveError,
  onRetrySave,
  onToggleRail,
  onPreview,
  onRevision,
  onSubmit,
  revisionCount,
  isOpenSubmission,
}: {
  site: SiteRow;
  saveState: SaveState;
  saveError: string | null;
  onRetrySave: () => void;
  onToggleRail: () => void;
  onPreview: () => void;
  onRevision: () => void;
  onSubmit: () => void;
  revisionCount: number;
  isOpenSubmission: boolean;
}) {
  return (
    <header className="flex h-14 shrink-0 items-center justify-between gap-2 border-b border-line bg-surface px-3 sm:px-4">
      <div className="flex min-w-0 items-center gap-2 sm:gap-3">
        <button
          type="button"
          onClick={onToggleRail}
          aria-label="Pages and blocks"
          className="grid h-8 w-8 place-items-center rounded-lg text-muted hover:bg-ink-soft hover:text-ink lg:hidden"
        >
          <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
            <path d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
        <Link
          href="/dashboard"
          aria-label="Back to dashboard"
          className="text-muted hover:text-ink"
        >
          <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
            <path d="M15 18l-6-6 6-6" />
          </svg>
        </Link>
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-ink">{site.name}</p>
          <p className="truncate font-mono text-[11px] text-muted">/{site.slug}</p>
        </div>
      </div>

      <div className="flex items-center gap-1.5 sm:gap-2">
        <SaveIndicator state={saveState} error={saveError} onRetry={onRetrySave} />
        <Button size="sm" variant="outline" onClick={onPreview}>
          Preview
        </Button>
        <Button size="sm" variant="outline" onClick={onRevision}>
          <span className="rounded bg-ink-soft px-1.5 text-[11px] font-semibold">
            {revisionCount}
          </span>
          <span className="hidden sm:inline">Versions</span>
          <span className="sr-only sm:hidden">Versions</span>
        </Button>
        <Button size="sm" onClick={onSubmit} disabled={isOpenSubmission}>
          {isOpenSubmission ? "In review" : "Submit"}
          <span className="hidden sm:inline">{isOpenSubmission ? "" : "for review"}</span>
        </Button>
      </div>
    </header>
  );
}

function SaveIndicator({
  state,
  error,
  onRetry,
}: {
  state: SaveState;
  error: string | null;
  onRetry: () => void;
}) {
  return (
    <span
      role="status"
      aria-live="polite"
      className="hidden items-center gap-1.5 pr-1 text-xs text-muted sm:flex"
    >
      <span
        aria-hidden="true"
        className={cn(
          "h-1.5 w-1.5 rounded-full",
          state === "saving" && "animate-pulse bg-warning",
          state === "saved" && "bg-success",
          state === "error" && "bg-danger",
        )}
      />
      {state === "saving" ? "Saving…" : null}
      {state === "saved" ? "All changes saved" : null}
      {state === "error" ? (
        <span title={error ?? undefined}>
          Not saved ·{" "}
          <button type="button" onClick={onRetry} className="font-medium text-copper hover:underline">
            Retry
          </button>
        </span>
      ) : null}
    </span>
  );
}

export function StatusStrip({
  submission,
  liveUrl,
}: {
  submission: SubmissionRow | null;
  liveUrl: string | null;
}) {
  const meta = submission ? submissionStatus(submission.status) : null;
  return (
    <div className="flex shrink-0 flex-wrap items-center justify-between gap-x-3 gap-y-1 border-b border-line bg-canvas px-4 py-2 text-xs">
      <div className="flex min-w-0 flex-wrap items-center gap-x-3 gap-y-1">
        {meta ? (
          <span className="flex items-center gap-1.5 text-ink">
            <span aria-hidden="true" className={cn("h-1.5 w-1.5 rounded-full", meta.dot)} />
            <span className="font-medium">
              Status: {meta.label}
              {submission?.reviewed_at ? ` · ${formatDateTime(submission.reviewed_at)}` : ""}
            </span>
          </span>
        ) : null}
        {submission?.owner_notes ? (
          <span className="min-w-0 max-w-full truncate text-muted">
            Owner note: “{submission.owner_notes}”
          </span>
        ) : null}
      </div>
      {liveUrl ? (
        <a
          href={liveUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1.5 text-success hover:underline"
        >
          <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
            <path d="M10 13a5 5 0 0 0 7 0l3-3a5 5 0 0 0-7-7l-1.5 1.5" />
            <path d="M14 11a5 5 0 0 0-7 0l-3 3a5 5 0 0 0 7 7l1.5-1.5" />
          </svg>
          <span className="max-w-[220px] truncate font-mono">
            {liveUrl.replace(/^https?:\/\//, "")}
          </span>
          <span className="sr-only">(opens in a new tab)</span>
        </a>
      ) : null}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Left rail                                                            */
/* ------------------------------------------------------------------ */

export function RailTabs({
  value,
  onChange,
}: {
  value: "pages" | "blocks" | "design";
  onChange: (v: "pages" | "blocks" | "design") => void;
}) {
  return (
    <div className="border-b border-line px-3 pb-2 pt-3">
      <div role="tablist" aria-label="Editor panels" className="flex gap-1 rounded-lg bg-ink-soft p-0.5">
        {(["pages", "blocks", "design"] as const).map((tab) => (
          <button
            key={tab}
            type="button"
            role="tab"
            aria-selected={value === tab}
            onClick={() => onChange(tab)}
            className={cn(
              "flex-1 rounded-md px-2 py-1 text-sm font-medium capitalize transition-colors",
              value === tab ? "bg-surface text-ink shadow-ws-sm" : "text-muted hover:text-ink",
            )}
          >
            {tab}
          </button>
        ))}
      </div>
    </div>
  );
}

export function PageList({
  tabs,
  activeKey,
  onSelect,
  onAdd,
  onDelete,
}: {
  tabs: PageDraft[];
  activeKey: string;
  onSelect: (key: string) => void;
  onAdd: (title: string) => Promise<string | null>;
  onDelete: (key: string) => void;
}) {
  const [adding, setAdding] = useState(false);
  const [title, setTitle] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function add() {
    if (!title.trim() || busy) return;
    setBusy(true);
    setError(null);
    const err = await onAdd(title);
    setBusy(false);
    if (err) {
      setError(err);
      return;
    }
    setAdding(false);
    setTitle("");
  }

  return (
    <div className="p-2">
      <p className="px-2 pb-2 pt-1 text-[11px] font-medium uppercase tracking-wider text-muted">
        {tabs.length} page{tabs.length === 1 ? "" : "s"}
      </p>
      <ul className="flex flex-col gap-1">
        {tabs.map((t) => {
          const active = t.key === activeKey;
          return (
            <li key={t.key} className="group relative">
              <button
                type="button"
                onClick={() => onSelect(t.key)}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex w-full flex-col rounded-lg px-2.5 py-2 pr-8 text-left text-sm transition-colors",
                  active ? "bg-copper-soft text-copper" : "text-ink hover:bg-ink-soft",
                )}
              >
                <span className="truncate font-medium">{t.title || "Untitled"}</span>
                <span className="truncate font-mono text-[11px] text-muted">{t.path}</span>
              </button>
              {t.path !== "/" ? (
                <button
                  type="button"
                  onClick={() => onDelete(t.key)}
                  aria-label={`Delete page ${t.title}`}
                  className="absolute right-1.5 top-1/2 grid h-6 w-6 -translate-y-1/2 place-items-center rounded-md text-muted opacity-0 hover:bg-danger-soft hover:text-danger focus-visible:opacity-100 group-hover:opacity-100"
                >
                  <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                    <path d="M18 6 6 18M6 6l12 12" />
                  </svg>
                </button>
              ) : null}
            </li>
          );
        })}
      </ul>

      {adding ? (
        <div className="mt-2 flex flex-col gap-2 rounded-lg border border-line bg-white p-2.5">
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") void add();
              if (e.key === "Escape") setAdding(false);
            }}
            placeholder="Page title"
            aria-label="Page title"
            maxLength={60}
            autoFocus
            className="rounded-md border border-line px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-copper/25"
          />
          {error ? (
            <p role="alert" className="text-xs text-danger">
              {error}
            </p>
          ) : null}
          <div className="flex gap-1.5">
            <Button size="sm" className="flex-1" onClick={() => void add()} loading={busy} disabled={!title.trim()}>
              Add page
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setAdding(false)}>
              Cancel
            </Button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setAdding(true)}
          className="mt-2 flex w-full items-center gap-1.5 rounded-lg border border-dashed border-line px-2.5 py-2 text-sm text-muted hover:border-copper/50 hover:text-copper"
        >
          <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
            <path d="M12 5v14M5 12h14" />
          </svg>
          Add page
        </button>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Canvas toolbar                                                       */
/* ------------------------------------------------------------------ */

export function CanvasToolbar({
  blockCount,
  selectedIndex,
  onMove,
  onDuplicate,
  onDelete,
}: {
  blockCount: number;
  /** Index of the selected block, or -1 when nothing is selected. */
  selectedIndex: number;
  onMove: (dir: -1 | 1) => void;
  onDuplicate: () => void;
  onDelete: () => void;
}) {
  const selected = selectedIndex >= 0;
  return (
    <div className="flex h-11 shrink-0 items-center justify-between gap-2 border-b border-line bg-surface px-3 sm:px-4">
      <div className="flex items-center gap-1" role="toolbar" aria-label="Block actions">
        <IconBtn title="Move up" disabled={!selected || selectedIndex === 0} onClick={() => onMove(-1)}>
          <path d="M12 19V5M5 12l7-7 7 7" />
        </IconBtn>
        <IconBtn title="Move down" disabled={!selected || selectedIndex === blockCount - 1} onClick={() => onMove(1)}>
          <path d="M12 5v14M5 12l7 7 7-7" />
        </IconBtn>
        <IconBtn title="Duplicate block" disabled={!selected} onClick={onDuplicate}>
          <path d="M8 8h12v12H8zM4 16V4h12" />
        </IconBtn>
        <IconBtn title="Delete block" disabled={!selected} danger onClick={onDelete}>
          <path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3" />
        </IconBtn>
      </div>
      <p className="text-xs text-muted">
        {blockCount} block{blockCount === 1 ? "" : "s"}
        <span className="hidden sm:inline"> · Click a block to edit</span>
      </p>
    </div>
  );
}

function IconBtn({
  title,
  onClick,
  disabled,
  danger,
  children,
}: {
  title: string;
  onClick: () => void;
  disabled?: boolean;
  danger?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      title={title}
      aria-label={title}
      disabled={disabled}
      onClick={onClick}
      className={cn(
        "grid h-8 w-8 place-items-center rounded-lg text-muted transition-colors disabled:pointer-events-none disabled:opacity-35",
        danger ? "hover:bg-danger-soft hover:text-danger" : "hover:bg-ink-soft hover:text-ink",
      )}
    >
      <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
        {children}
      </svg>
    </button>
  );
}

/* ------------------------------------------------------------------ */
/* Dialog bodies                                                        */
/* ------------------------------------------------------------------ */

export function VersionList({
  revisions,
}: {
  revisions: RevisionRow[];
}) {
  return (
    <div className="ws-scroll max-h-48 overflow-y-auto rounded-lg border border-line">
      {revisions.length === 0 ? (
        <p className="p-3 text-sm text-muted">No versions yet.</p>
      ) : (
        <ul>
          {revisions.map((r, i) => (
            <li
              key={r.id}
              className="flex items-center justify-between border-b border-line px-3 py-2 last:border-b-0"
            >
              <div>
                <p className="text-sm font-medium text-ink">
                  Version {r.number}
                  {i === 0 ? (
                    <Badge tone="copper" className="ml-2">
                      latest
                    </Badge>
                  ) : null}
                </p>
                <p className="text-xs text-muted">{formatDateTime(r.created_at)}</p>
              </div>
              <span className="font-mono text-[10px] text-muted" title={r.content_hash}>
                {r.content_hash.slice(0, 8)}…
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export function FullPreviewModal({
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

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-canvas" role="dialog" aria-modal="true" aria-label={`Preview of ${site.name}`}>
      <div className="flex shrink-0 flex-wrap items-center justify-between gap-2 border-b border-line bg-surface px-3 py-2 sm:px-4">
        <div className="flex items-center gap-3">
          <Wordmark compact />
          <span className="hidden text-sm text-muted sm:inline">Preview — {site.name}</span>
        </div>
        <div className="order-3 flex w-full gap-1 overflow-x-auto sm:order-none sm:w-auto" role="tablist" aria-label="Pages">
          {tabs.map((t) => (
            <button
              key={t.key}
              type="button"
              role="tab"
              aria-selected={t.key === page?.key}
              onClick={() => setPageKey(t.key)}
              className={cn(
                "shrink-0 rounded-lg px-3 py-1.5 text-sm font-medium",
                t.key === page?.key
                  ? "bg-copper-soft text-copper"
                  : "text-muted hover:bg-ink-soft hover:text-ink",
              )}
            >
              {t.title}
            </button>
          ))}
        </div>
        <Button size="sm" variant="outline" onClick={onClose}>
          Close (Esc)
        </Button>
      </div>
      <div className="ws-scroll flex-1 overflow-y-auto bg-canvas p-3 sm:p-6">
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
