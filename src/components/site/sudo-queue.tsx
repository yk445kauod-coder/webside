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
      <Section
        title="Needs review"
        items={open}
        empty="Nothing waiting — you're caught up."
        onOpen={setReviewing}
      />
      <Section
        title="History"
        items={resolved}
        empty="Approved and rejected submissions will appear here."
        onOpen={setReviewing}
        className="mt-12"
      />

      {reviewing ? <ReviewModal item={reviewing} onClose={() => setReviewing(null)} /> : null}
    </div>
  );
}

function Section({
  title,
  items,
  empty,
  onOpen,
  className,
}: {
  title: string;
  items: SudoQueueItem[];
  empty: string;
  onOpen: (item: SudoQueueItem) => void;
  className?: string;
}) {
  return (
    <section className={className} aria-label={title}>
      <div className="mb-3 flex items-center gap-2">
        <h2 className="ws-h2">{title}</h2>
        {items.length > 0 ? (
          <span className="rounded-full bg-copper-soft px-2.5 py-0.5 text-xs font-semibold text-copper">
            {items.length}
          </span>
        ) : null}
      </div>
      {items.length === 0 ? (
        <p className="rounded-xl border border-dashed border-line bg-surface px-4 py-6 text-sm text-muted">
          {empty}
        </p>
      ) : (
        <ul className="grid gap-4 lg:grid-cols-2">
          {items.map((item) => (
            <li key={item.submission.id}>
              <RequestCard item={item} onOpen={() => onOpen(item)} />
            </li>
          ))}
        </ul>
      )}
    </section>
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
      type="button"
      onClick={onOpen}
      className="flex h-full w-full flex-col gap-3 rounded-2xl border border-line bg-surface p-5 text-left shadow-ws-sm transition-all hover:-translate-y-0.5 hover:shadow-ws"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="truncate font-semibold text-ink">{site.name}</h3>
          <p className="mt-0.5 truncate font-mono text-xs text-muted">/{site.slug}</p>
        </div>
        <Badge tone={meta.tone}>{meta.label}</Badge>
      </div>

      <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted">
        <span>
          From{" "}
          <span className="font-medium text-ink">{owner?.display_name ?? owner?.email ?? "—"}</span>
        </span>
        <span>{formatDateTime(submission.submitted_at)}</span>
      </div>

      <div className="flex flex-wrap items-center gap-3 text-xs text-muted">
        <span className="rounded-md bg-ink-soft px-2 py-1 font-mono text-[11px]">v{revision.number}</span>
        <span>
          {pageCount} page{pageCount === 1 ? "" : "s"}
        </span>
        <span>
          {blockCount} block{blockCount === 1 ? "" : "s"}
        </span>
        <span className="font-mono text-[10px]">{revision.content_hash.slice(0, 10)}…</span>
      </div>

      {submission.note ? (
        <p className="line-clamp-2 rounded-lg bg-orange-soft/50 px-3 py-2 text-xs text-ink">
          <span className="font-medium text-orange-ink">Note: </span>
          {submission.note}
        </p>
      ) : null}

      {publications.length > 0 ? (
        <p className="flex items-center gap-1.5 text-xs text-success">
          <span className="sr-only">Published at</span>
          <span className="truncate font-mono">{publications[0].url.replace(/^https?:\/\//, "")}</span>
        </p>
      ) : null}

      <div className="mt-auto border-t border-line pt-3 text-xs font-medium text-copper">
        Review this version →
      </div>
    </button>
  );
}
