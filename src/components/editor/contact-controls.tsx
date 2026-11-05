"use client";

import { Field } from "@/components/ui/field";
import { LIMITS } from "@/lib/limits";
import { whatsappHref } from "@/lib/contact";
import type { ContactBlock } from "@/lib/types/blocks";

const small =
  "rounded-lg border border-dashed border-line px-3 py-1.5 text-xs font-medium text-muted hover:border-copper/50 hover:text-copper";

/** Editor for the contact block: phone, WhatsApp, address, opening hours and a QR code. */
export function ContactControls({
  block,
  onChange,
}: {
  block: ContactBlock;
  onChange: (b: ContactBlock) => void;
}) {
  const wa = whatsappHref(block.whatsapp);
  const setHour = (i: number, patch: Partial<ContactBlock["hours"][number]>) =>
    onChange({ ...block, hours: block.hours.map((h, j) => (j === i ? { ...h, ...patch } : h)) });
  return (
    <>
      <Field label="Title" value={block.title} maxLength={LIMITS.contactTitle} onChange={(title) => onChange({ ...block, title })} />
      <Field label="Phone" hint="Shown as a call button" value={block.phone} maxLength={LIMITS.contactPhone} onChange={(phone) => onChange({ ...block, phone })} />
      <Field label="WhatsApp number" hint="Any format, e.g. 01012345678 or +20 101 234 5678" value={block.whatsapp} maxLength={LIMITS.contactPhone} onChange={(whatsapp) => onChange({ ...block, whatsapp })} />
      <Field textarea rows={2} label="Address" value={block.address} maxLength={LIMITS.contactAddress} onChange={(address) => onChange({ ...block, address })} />
      <Field label="Map link" hint="Paste a Google Maps link" value={block.mapUrl} maxLength={LIMITS.url} onChange={(mapUrl) => onChange({ ...block, mapUrl })} />

      <fieldset className="flex flex-col gap-3">
        <legend className="mb-1 text-sm font-medium text-ink">Opening hours</legend>
        {block.hours.map((h, i) => (
          <div key={i} className="flex flex-col gap-3 rounded-lg border border-line bg-canvas p-3">
            <Field label={`Days ${i + 1}`} value={h.day} maxLength={LIMITS.contactDay} onChange={(day) => setHour(i, { day })} />
            <Field label="Hours" hint="e.g. 10:00 - 22:00 or Closed" value={h.time} maxLength={LIMITS.contactTime} onChange={(time) => setHour(i, { time })} />
            <button type="button" onClick={() => onChange({ ...block, hours: block.hours.filter((_, j) => j !== i) })} className="self-end text-xs font-medium text-danger hover:underline">
              Remove row {i + 1}
            </button>
          </div>
        ))}
        {block.hours.length < LIMITS.contactHours ? (
          <button type="button" onClick={() => onChange({ ...block, hours: [...block.hours, { day: "", time: "" }] })} className={small + " self-start"}>
            + Add hours
          </button>
        ) : null}
      </fieldset>

      <Field label="QR code link" hint="Where the QR code leads (your menu, site or WhatsApp). Leave empty for no QR." value={block.qrUrl} maxLength={LIMITS.qrUrl} onChange={(qrUrl) => onChange({ ...block, qrUrl })} />
      {wa ? (
        <button type="button" onClick={() => onChange({ ...block, qrUrl: wa })} className={small + " self-start"}>
          Use my WhatsApp link for the QR
        </button>
      ) : null}
    </>
  );
}
