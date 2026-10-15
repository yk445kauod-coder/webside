"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { PreviewCanvas } from "@/components/preview/preview-canvas";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatDateTime, cn } from "@/lib/utils";
import {
  reviewSubmission,
  recordPublication,
  takeSubmission,
} from "@/app/sudo/actions";
import type { SudoQueueItem } from "@/lib/queries/sudo";

interface Props {
  item: SudoQueueItem;
  onClose: () => void;
}

export function ReviewModal({ item, onClose }: Props) {
  const router = useRouter();
  const { submission, revision, site, owner, publications } = item;

  const pageKeys = Object.keys(revision.pages);
  const [pageKey, setPageKey] = useState(pageKeys[0] ?? "");
  const [notes, setNotes] = useState("");
  const [url, setUrl] = useState("");
  const [busy, setBusy] = useState<null | string>(null);
  const [error, setError] = useState<string | null>(null);

  const page = revision.pages[pageKey];

  async function run(action: string, fn: () => Promise<{ ok: boolean; error?: string }>) {
    setBusy(action);
    setError(null);
    const res = await fn();
    setBusy(null);
    if (!res.ok) {
      setError(res.error ?? "Something went wrong.");
      return;
    }
    router.refresh();
    onClose();
  }

  const open = submission.status === "submitted" || submission.status === "under_review";

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-ink/60 p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
      role="dialog"
      aria-modal="true"
      aria-label={`Review ${site.name}`}
    >
      <div className="flex h-[90vh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl border border-line bg-surface shadow-ws">
        {/* Header */}
        <div className="flex shrink-0 items-start justify-between gap-4 border-b border-line px-5 py-4">
          <div>
            <div className="flex items-center gap-3">
              <h2 className="ws-h2">{site.name}</h2>
              <Badge tone={submission.status === "submitted" ? "cobalt" : submission.status === "under_review" ? "warning" : submission.status === "approved" ? "success" : "danger"}>
                {submission.status}
              </Badge>
            </div>
            <p className="mt-1 text-xs text-muted">
              Submitted {formatDateTime(submission.submitted_at)} by{" "}
              {owner?.display_name ?? owner?.email ?? "unknown"} · Version{" "}
              {revision.number} ·{" "}
              <span className="font-mono">{revision.content_hash.slice(0, 10)}…</span>
            </p>
            {submission.note ? (
              <p className="mt-2 rounded-lg bg-apricot-soft/60 px-3 py-2 text-sm text-ink">
                <span className="font-medium text-[#a05c2c]">Customer note: </span>
                {submission.note}
              </p>
            ) : null}
            {submission.owner_notes ? (
              <p className="mt-2 rounded-lg bg-warning-soft/60 px-3 py-2 text-sm text-ink">
                <span className="font-medium text-warning">Your previous note: </span>
                {submission.owner_notes}
              </p>
            ) : null}
          </div>
          <button onClick={onClose} className="rounded-lg p-1.5 text-muted hover:bg-ink-soft hover:text-ink" aria-label="Close">
            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="flex min-h-0 flex-1 flex-col lg:flex-row">
          {/* Preview (exact submitted revision) */}
          <div className="flex min-h-0 flex-1 flex-col">
            <div className="flex shrink-0 items-center gap-1.5 border-b border-line bg-canvas px-3 py-2">
              {pageKeys.map((key) => (
                <button
                  key={key}
                  onClick={() => setPageKey(key)}
                  className={cn(
                    "rounded-lg px-3 py-1.5 text-sm font-medium",
                    pageKey === key
                      ? "bg-ink text-white"
                      : "text-muted hover:bg-ink-soft hover:text-ink",
                  )}
                >
                  {revision.pages[key].title}
                </button>
              ))}
              <span className="ml-auto text-[11px] text-muted">
                Exact revision — immutable
              </span>
            </div>
            <div className="ws-scroll flex-1 overflow-y-auto bg-canvas p-4">
              <PreviewCanvas
                blocks={page?.blocks ?? []}
                title={`${site.name} — ${page?.title ?? ""}`}
                framed
              />
            </div>
          </div>

          {/* Sidebar actions */}
          <div className="flex w-full shrink-0 flex-col gap-4 border-t border-line p-5 lg:w-80 lg:border-l lg:border-t-0">
            {publications.length > 0 ? (
              <div>
                <p className="mb-2 text-xs font-medium uppercase tracking-wider text-muted">
                  Published URLs
                </p>
                <ul className="flex flex-col gap-1.5">
                  {publications.map((p) => (
                    <li key={p.id} className="flex items-center gap-1.5 text-sm">
                      <a
                        href={p.url}
                        target="_blank"
                        rel="noreferrer"
                        className="truncate font-mono text-xs text-success hover:underline"
                      >
                        {p.url.replace(/^https?:\/\//, "")}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}

            {open ? (
              <>
                <label className="block">
                  <span className="mb-1 block text-sm font-medium text-ink">
                    Feedback to the customer
                  </span>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows={3}
                    className="w-full resize-y rounded-[10px] border border-line bg-white px-3 py-2 text-sm text-ink focus:outline-none focus:ring-[3px] focus:ring-cobalt/25"
                    placeholder="Approve with a note, or explain what to change."
                  />
                </label>

                <div className="flex flex-col gap-2">
                  <Button
                    variant="success"
                    loading={busy === "approve"}
                    onClick={() =>
                      run("approve", () =>
                        reviewSubmission(submission.id, "approved", notes),
                      )
                    }
                  >
                    Approve version
                  </Button>
                  {submission.status === "submitted" ? (
                    <Button
                      variant="outline"
                      loading={busy === "take"}
                      onClick={() =>
                        run("take", () => takeSubmission(submission.id))
                      }
                    >
                      Take into review
                    </Button>
                  ) : null}
                  <Button
                    variant="danger"
                    loading={busy === "reject"}
                    onClick={() =>
                      run("reject", () =>
                        reviewSubmission(submission.id, "rejected", notes),
                      )
                    }
                  >
                    Reject
                  </Button>
                </div>
              </>
            ) : submission.status === "approved" ? (
              <div className="flex flex-col gap-3">
                <label className="block">
                  <span className="mb-1 block text-sm font-medium text-ink">
                    Verified public URL
                  </span>
                  <input
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    placeholder="https://yoursite.example.com"
                    className="w-full rounded-[10px] border border-line bg-white px-3 py-2 font-mono text-sm text-ink focus:outline-none focus:ring-[3px] focus:ring-cobalt/25"
                  />
                </label>
                <Button
                  variant="secondary"
                  loading={busy === "publish"}
                  disabled={!url.trim()}
                  onClick={() =>
                    run("publish", () => recordPublication(submission.id, url))
                  }
                >
                  Record public URL
                </Button>
                <p className="text-xs leading-relaxed text-muted">
                  Publish the approved version manually on your hosting, then
                  record the verified URL here. It appears on the customer&apos;s
                  dashboard.
                </p>
              </div>
            ) : (
              <p className="rounded-lg bg-danger-soft px-3 py-2 text-sm text-danger">
                This version was rejected. Ask the customer to make changes and
                submit a new version.
              </p>
            )}

            {error ? (
              <p role="alert" className="rounded-lg bg-danger-soft px-3 py-2 text-sm text-danger">
                {error}
              </p>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}

