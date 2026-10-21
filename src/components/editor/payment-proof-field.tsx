"use client";

import { useState } from "react";
import { compressProof } from "@/lib/payment-proof";

interface Props {
  instapay: string;
  required: boolean;
  onBlob: (blob: Blob | null) => void;
}

/** InstaPay instructions plus a screenshot picker. The image is shrunk in the browser first. */
export function PaymentProofField({ instapay, required, onBlob }: Props) {
  const [preview, setPreview] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function pick(file: File | undefined) {
    setError(null);
    onBlob(null);
    if (preview) URL.revokeObjectURL(preview);
    setPreview(null);
    if (!file) return;
    setBusy(true);
    try {
      const blob = await compressProof(file);
      setPreview(URL.createObjectURL(blob));
      onBlob(blob);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Couldn't read that image.");
    } finally {
      setBusy(false);
    }
  }

  const link = /^https?:\/\//i.test(instapay) ? instapay : null;

  return (
    <div className="flex flex-col gap-2 rounded-xl border border-line bg-canvas p-4">
      <p className="text-sm font-semibold text-ink">
        Payment {required ? "(required to publish)" : "(optional)"}
      </p>
      <p className="text-sm leading-relaxed text-muted">
        Pay through InstaPay
        {link ? (
          <>
            {" "}
            using{" "}
            <a href={link} target="_blank" rel="noopener noreferrer" className="font-medium text-cobalt underline">
              this link
            </a>
          </>
        ) : instapay ? (
          <>
            {" "}
            to <span className="font-mono text-ink">{instapay}</span>
          </>
        ) : null}
        , then attach a screenshot of the transfer.
      </p>
      <input
        type="file"
        accept="image/png,image/jpeg,image/webp"
        onChange={(e) => void pick(e.target.files?.[0])}
        className="block w-full text-sm text-muted file:mr-3 file:rounded-lg file:border-0 file:bg-ink file:px-3 file:py-2 file:text-sm file:font-medium file:text-white"
        aria-label="Transfer screenshot"
      />
      {busy ? <p className="text-xs text-muted">Preparing image…</p> : null}
      {preview ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={preview} alt="Transfer screenshot preview" className="max-h-40 w-auto self-start rounded-lg border border-line" />
      ) : null}
      {error ? <p role="alert" className="text-sm text-danger">{error}</p> : null}
      <p className="text-xs text-muted">The screenshot is private, visible only to you and the site owner, and deleted after the payment is verified.</p>
    </div>
  );
}
