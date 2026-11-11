"use client";

import { useState } from "react";
import { compressProof } from "@/lib/payment-proof";
import { PAYMENT_METHODS, type PaymentAccounts, type PaymentMethodId } from "@/lib/payment-methods";

interface Props {
  accounts: PaymentAccounts;
  amount: number;
  kind: "setup" | "edit";
  required: boolean;
  method: PaymentMethodId | null;
  onMethod: (m: PaymentMethodId) => void;
  reference: string;
  onReference: (v: string) => void;
  onBlob: (blob: Blob | null) => void;
}

/** Payment method picker, amount due, where to send it, the sender's reference and a transfer screenshot (shrunk in the browser first). */
export function PaymentProofField({ accounts, amount, kind, required, method, onMethod, reference, onReference, onBlob }: Props) {
  const [preview, setPreview] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(false);

  const available = PAYMENT_METHODS.filter((m) => accounts[m.id]);
  const account = method ? accounts[method] : undefined;
  const link = account && /^https?:\/\//i.test(account) ? account : null;

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

  async function copy() {
    if (!account) return;
    try {
      await navigator.clipboard.writeText(account);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* clipboard unavailable */
    }
  }

  return (
    <div dir="rtl" className="flex flex-col gap-3 rounded-xl border border-line bg-canvas p-4 text-start">
      <div className="flex items-baseline justify-between gap-3">
        <p className="text-sm font-semibold text-ink">الدفع {required ? "(مطلوب للنشر)" : "(رسوم التعديل)"}</p>
        <p className="text-lg font-bold text-ink">
          {amount} <span className="text-xs font-medium text-muted">جنيه {kind === "setup" ? "· رسوم التأسيس" : "· رسوم تعديل"}</span>
        </p>
      </div>

      {available.length ? (
        <>
          <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="طريقة الدفع">
            {available.map((m) => (
              <button
                key={m.id}
                type="button"
                role="radio"
                aria-checked={method === m.id}
                onClick={() => onMethod(m.id)}
                className={
                  "rounded-full border px-3 py-1.5 text-sm font-medium transition " +
                  (method === m.id ? "border-ink bg-ink text-white" : "border-line bg-surface text-ink hover:border-ink")
                }
              >
                {m.label}
              </button>
            ))}
          </div>

          {account ? (
            <div className="flex flex-col gap-1 rounded-lg bg-black/5 p-3 text-sm">
              <span className="text-muted">حوّل المبلغ إلى:</span>
              {link ? (
                <a href={link} target="_blank" rel="noopener noreferrer" className="font-medium text-copper underline">
                  رابط الدفع
                </a>
              ) : (
                <span dir="ltr" className="select-all break-all text-end font-mono text-ink">{account}</span>
              )}
              <span className="text-xs text-muted">تقدر تحوّل من أي محفظة أو إنستاباي لأي محفظة أو حساب. حسب بنكك أو محفظتك ممكن تتخصم رسوم بسيطة (غالباً حوالي 1%).</span>
              <button type="button" onClick={() => void copy()} className="self-start text-xs font-medium text-copper underline">
                {copied ? "تم النسخ" : "نسخ"}
              </button>
            </div>
          ) : (
            <p className="text-sm text-muted">اختر طريقة الدفع لعرض رقم التحويل.</p>
          )}

          <label className="flex flex-col gap-1 text-sm">
            <span className="font-medium text-ink">
              رقم المحفظة أو الحساب اللي حوّلت منه / رقم العملية <span className="font-normal text-muted">(اختياري)</span>
            </span>
            <input
              dir="ltr"
              value={reference}
              maxLength={60}
              onChange={(e) => onReference(e.target.value)}
              placeholder="01xxxxxxxxx"
              className="rounded-lg border border-line bg-surface px-3 py-2 text-ink"
            />
          </label>
        </>
      ) : (
        <p className="text-sm text-muted">لسه مفيش طرق دفع متاحة. تواصل معنا وهنبعتلك بيانات التحويل.</p>
      )}

      <label className="flex flex-col gap-1 text-sm">
        <span className="font-medium text-ink">صورة إيصال التحويل</span>
        <input
          type="file"
          accept="image/png,image/jpeg,image/webp"
          onChange={(e) => void pick(e.target.files?.[0])}
          className="block w-full text-sm text-muted file:me-3 file:rounded-lg file:border-0 file:bg-ink file:px-3 file:py-2 file:text-sm file:font-medium file:text-white"
          aria-label="Transfer screenshot"
        />
      </label>
      {busy ? <p className="text-xs text-muted">جاري تجهيز الصورة…</p> : null}
      {preview ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={preview} alt="Transfer screenshot preview" className="max-h-40 w-auto self-start rounded-lg border border-line" />
      ) : null}
      {error ? <p role="alert" className="text-sm text-danger">{error}</p> : null}
      <p className="text-xs text-muted">الصورة خاصة: بتظهر ليك ولفريقنا بس، وبتتمسح بعد التأكد من الدفع.</p>
    </div>
  );
}
