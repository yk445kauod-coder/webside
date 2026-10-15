"use client";

import { useState } from "react";
import { ReviewModal } from "@/components/site/review-modal";
import { Badge } from "@/components/ui/badge";
import { submissionStatus } from "@/lib/submission-status";
import { formatDateTime } from "@/lib/utils";
import type { SudoQueueItem } from "@/lib/queries/sudo";

interface Props {
  open: SudoQueueItem[];
  resolved: SudoQueueItem[];
}

export function SudoQueue({ open, resolved }: Props) {
  const [reviewing, setReviewing] = useState<SudoQueueItem | null>(null);

  return (
    <div>
      <SectionTitle count={open.length} title="Needs review" empty="Nothing waiting — you're caught up." />
      {open.length > 0 ? (
        <div className="grid gap-4 lg:grid-cols-2">
          {open.map((item) => (
            <RequestCard key={item.submission.id} item={item} onOpen={() => setReviewing(item)} />
          ))}
        </div>
      ) : null}

      <SectionTitle count={resolved.length} title="History" empty="" className="mt-12" />
      {resolved.length > 0 ? (
        <div className="grid gap-4 lg:grid-cols-2">
          {resolved.map((item) => (
            <RequestCard key={item.submission.id} item={item} onOpen={() => setReviewing(item)} />
          ))}
        </div>
      ) : (
        <p className="rounded-xl border border-dashed border-line bg-surface px-4 py-6 text-sm text-muted">
          Approved and rejected submissions will appear here.
        </p>
      )}

      {reviewing ? (
        <ReviewModal item={reviewing} onClose={() => setReviewing(null)} />
      ) : null}
    </div>
  );
}

function SectionTitle({
  title,
  count,
  empty,
  className,
}: {
  title: string;
  count: number;
  empty: string;
  className?: string;
}) {
  return (
    <div className={className}>
      <div className="mb-3 flex items-center gap-2">
        <h2 className="ws-h2">{title}</h2>
        {count > 0 ? (
          <span className="rounded-full bg-cobalt-soft px-2.5 py-0.5 text-xs font-semibold text-cobalt">
            {count}
          </span>
        ) : null}
      </div>
      {count === 0 && empty ? (
        <p className="rounded-xl border border-dashed border-line bg-surface px-4 py-6 text-sm text-muted">
          {empty}
        </p>
      ) : null}
    </div>
  );
}

function RequestCard({ item, onOpen }: { item: SudoQueueItem; onOpen: () => void }) {
  const { submission, revision, site, owner, publications } = item;
  const meta = submissionStatus(submission.status);
  const pageCount = Object.keys(revision.pages).length;
  const blockCount = Object.values(revision.pages).reduce(
    (acc, p) => acc + (p.blocks?.length ?? 0),
    0,
  );

  return (
    <button
      onClick={onOpen}
      className="flex flex-col gap-3 rounded-2xl border border-line bg-surface p-5 text-left shadow-ws-sm transition-all hover:-translate-y-0.5 hover:shadow-ws"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="truncate font-semibold text-ink">{site.name}</h3>
          <p className="mt-0.5 font-mono text-xs text-muted">/{site.slug}</p>
        </div>
        <Badge tone={meta.tone}>{meta.label}</Badge>
      </div>

      <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted">
        <span>
          From <span className="font-medium text-ink">{owner?.display_name ?? owner?.email ?? "—"}</span>
        </span>
        <span>{formatDateTime(submission.submitted_at)}</span>
      </div>

      <div className="flex items-center gap-3 text-xs text-muted">
        <span className="rounded-md bg-ink-soft px-2 py-1 font-mono text-[11px]">
          v{revision.number}
        </span>
        <span>{pageCount} page{pageCount === 1 ? "" : "s"}</span>
        <span>{blockCount} block{blockCount === 1 ? "" : "s"}</span>
        <span className="font-mono text-[10px]">{revision.content_hash.slice(0, 10)}…</span>
      </div>

      {submission.note ? (
        <p className="line-clamp-2 rounded-lg bg-apricot-soft/50 px-3 py-2 text-xs text-ink">
          <span className="font-medium text-[#a05c2c]">Note: </span>
          {submission.note}
        </p>
      ) : null}

      {publications.length > 0 ? (
        <p className="flex items-center gap-1.5 text-xs text-success">
          <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 15v6m0-6l-4 4m4-4l4 4" />
            <path d="M5 15H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2h-1" />
          </svg>
          <span className="truncate font-mono">{publications[0].url.replace(/^https?:\/\//, "")}</span>
        </p>
      ) : null}

      <div className="mt-1 border-t border-line pt-3 text-xs font-medium text-cobalt">
        Review this version →
      </div>
    </button>
  );
}