"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { PreviewCanvas } from "@/components/preview/preview-canvas";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CloseButton, Dialog } from "@/components/ui/dialog";
import { Field } from "@/components/ui/field";
import { isOpenStatus, submissionStatus } from "@/lib/submission-status";
import { cn, formatDateTime } from "@/lib/utils";
import { deletePaymentProof, getPaymentProofUrl, recordPublication, reviewSubmission, takeSubmission } from "@/app/sudo/actions";
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
  const meta = submissionStatus(submission.status);
  const open = isOpenStatus(submission.status);

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

  return (
    <Dialog
      bare
      title={`Review ${site.name}`}
      onClose={() => !busy && onClose()}
      className="flex h-[100dvh] max-w-4xl flex-col sm:h-[90vh]"
    >
      {/* Header */}
      <div className="flex shrink-0 items-start justify-between gap-4 border-b border-line px-5 py-4">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-3">
            <h2 className="ws-h2 truncate">{site.name}</h2>
            <Badge tone={meta.tone}>{meta.label}</Badge>
          </div>
          <p className="mt-1 text-xs text-muted">
            Submitted {formatDateTime(submission.submitted_at)} by{" "}
            {owner?.display_name ?? owner?.email ?? "unknown"} · Version {revision.number} ·{" "}
            <span className="font-mono" title={revision.content_hash}>
              {revision.content_hash.slice(0, 10)}…
            </span>
          </p>
          {submission.note ? (
            <p className="mt-2 rounded-lg bg-orange-soft/60 px-3 py-2 text-sm text-ink">
              <span className="font-medium text-orange-ink">Customer note: </span>
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
        <CloseButton onClick={onClose} />
      </div>

      {/* Body */}
      <div className="flex min-h-0 flex-1 flex-col overflow-y-auto lg:flex-row lg:overflow-hidden">
        {/* Preview (exact submitted revision) */}
        <div className="flex min-h-[50vh] flex-1 flex-col lg:min-h-0">
          <div className="flex shrink-0 items-center gap-1.5 overflow-x-auto border-b border-line bg-canvas px-3 py-2" role="tablist" aria-label="Pages in this version">
            {pageKeys.map((key) => (
              <button
                key={key}
                type="button"
                role="tab"
                aria-selected={pageKey === key}
                onClick={() => setPageKey(key)}
                className={cn(
                  "shrink-0 rounded-lg px-3 py-1.5 text-sm font-medium",
                  pageKey === key ? "bg-ink text-white" : "text-muted hover:bg-ink-soft hover:text-ink",
                )}
              >
                {revision.pages[key].title}
              </button>
            ))}
            <span className="ml-auto shrink-0 pl-3 text-[11px] text-muted">Exact revision — immutable</span>
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
        <div className="flex w-full shrink-0 flex-col gap-4 border-t border-line p-5 lg:w-80 lg:overflow-y-auto lg:border-l lg:border-t-0">
          {publications.length > 0 ? (
            <div>
              <p className="mb-2 text-xs font-medium uppercase tracking-wider text-muted">Published URLs</p>
              <ul className="flex flex-col gap-1.5">
                {publications.map((p) => (
                  <li key={p.id}>
                    <a
                      href={p.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block truncate font-mono text-xs text-success hover:underline"
                    >
                      {p.url.replace(/^https?:\/\//, "")}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          {submission.payment_proof_path ? (
            <div className="flex flex-col gap-2 rounded-xl border border-line bg-canvas p-3">
              <p className="text-xs font-medium uppercase tracking-wider text-muted">Payment proof</p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  loading={busy === "proof"}
                  disabled={busy !== null}
                  onClick={async () => {
                    setBusy("proof");
                    setError(null);
                    const res = await getPaymentProofUrl(submission.id);
                    setBusy(null);
                    if (res.ok && res.url) window.open(res.url, "_blank", "noopener,noreferrer");
                    else setError(res.error ?? "Couldn't open the screenshot.");
                  }}
                >
                  View
                </Button>
                <Button
                  variant="danger"
                  disabled={busy !== null}
                  onClick={() => {
                    if (confirm("Delete the screenshot? Do this after verifying the payment.")) {
                      void run("proof-del", () => deletePaymentProof(submission.id));
                    }
                  }}
                >
                  Delete
                </Button>
              </div>
            </div>
          ) : null}

          {open ? (
            <>
              <Field
                textarea
                label="Feedback to the customer"
                placeholder="Approve with a note, or explain what to change."
                value={notes}
                maxLength={2000}
                onChange={setNotes}
              />
              <div className="flex flex-col gap-2">
                <Button
                  variant="success"
                  loading={busy === "approve"}
                  disabled={busy !== null}
                  onClick={() => run("approve", () => reviewSubmission(submission.id, "approved", notes))}
                >
                  Approve version
                </Button>
                {submission.status === "submitted" ? (
                  <Button
                    variant="outline"
                    loading={busy === "take"}
                    disabled={busy !== null}
                    onClick={() => run("take", () => takeSubmission(submission.id))}
                  >
                    Take into review
                  </Button>
                ) : null}
                <Button
                  variant="danger"
                  loading={busy === "reject"}
                  disabled={busy !== null || !notes.trim()}
                  onClick={() => run("reject", () => reviewSubmission(submission.id, "rejected", notes))}
                >
                  Reject
                </Button>
                {!notes.trim() ? (
                  <p className="text-xs text-muted">Add feedback to enable Reject — the customer needs to know what to change.</p>
                ) : null}
              </div>
            </>
          ) : submission.status === "approved" ? (
            <div className="flex flex-col gap-3">
              <Button
                loading={busy === "auto"}
                disabled={busy !== null}
                onClick={() => run("auto", () => publishViaRoute(submission.id))}
              >
                Publish to WebSide hosting
              </Button>
              <p className="text-xs leading-relaxed text-muted">
                Renders the approved version, commits it to the repository and records the link
                automatically. It goes live after the deploy finishes (a few minutes).
              </p>
              <hr className="border-line" />
              <Field
                label="Or record an external URL"
                placeholder="https://yoursite.example.com"
                value={url}
                maxLength={2048}
                onChange={setUrl}
              />
              <Button
                variant="secondary"
                loading={busy === "publish"}
                disabled={!url.trim() || busy !== null}
                onClick={() => run("publish", () => recordPublication(submission.id, url))}
              >
                Record public URL
              </Button>
              <p className="text-xs leading-relaxed text-muted">
                For a site hosted elsewhere (custom domain, own Pages project): record the verified URL
                here. It appears on the customer&apos;s dashboard.
              </p>
            </div>
          ) : (
            <p className="rounded-lg bg-danger-soft px-3 py-2 text-sm text-danger">
              This version was rejected. Ask the customer to make changes and submit a new version.
            </p>
          )}

          {error ? (
            <p role="alert" className="rounded-lg bg-danger-soft px-3 py-2 text-sm text-danger">
              {error}
            </p>
          ) : null}
        </div>
      </div>
    </Dialog>
  );
}

async function publishViaRoute(submissionId: string): Promise<{ ok: boolean; error?: string }> {
  try {
    const res = await fetch("/sudo/publish", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ submissionId }),
    });
    const data = (await res.json()) as { ok: boolean; error?: string };
    return data;
  } catch {
    return { ok: false, error: "Network error. Try again." };
  }
}
