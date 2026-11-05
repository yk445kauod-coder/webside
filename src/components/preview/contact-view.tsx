import type { ContactBlock } from "@/lib/types/blocks";
import { whatsappHref, telHref } from "@/lib/contact";
import { safeHref, isExternalHref } from "@/lib/safe-url";
import { qrSvg } from "@/lib/qr";
import { cn } from "@/lib/utils";

const btn =
  "inline-flex h-11 items-center justify-center rounded-2xl px-5 text-[15px] font-semibold shadow-ws-sm transition-transform hover:-translate-y-0.5";

/** Static contact section: call / WhatsApp buttons, address, hours and an inline-SVG QR code. No script. */
export function ContactView({ block, muted }: { block: ContactBlock; muted: string }) {
  const wa = whatsappHref(block.whatsapp);
  const tel = telHref(block.phone);
  const map = block.mapUrl ? safeHref(block.mapUrl) : "";
  const qrLink = block.qrUrl ? safeHref(block.qrUrl) : "";
  const qr = qrLink && qrLink !== "#" ? qrSvg(qrLink) : null;
  const hours = block.hours.filter((h) => h.day.trim() || h.time.trim());
  const nothing = !wa && !tel && !block.address && !hours.length && !qr;

  return (
    <div className="mx-auto grid max-w-4xl gap-8 md:grid-cols-[1fr_auto] md:items-start">
      <div className="flex flex-col gap-5">
        {block.title ? <h2 className="ws-h1 text-balance break-words">{block.title}</h2> : null}
        {nothing ? <p className={cn("text-sm", muted)}>Add a phone, WhatsApp number, address or hours.</p> : null}
        {(wa || tel) && (
          <div className="flex flex-wrap gap-3">
            {wa ? (
              <a href={wa} target="_blank" rel="noopener noreferrer" className={cn(btn, "bg-[#1f9d55] text-white")}>
                WhatsApp
              </a>
            ) : null}
            {tel ? (
              <a href={tel} className={cn(btn, "border border-current/30")}>
                {block.phone}
              </a>
            ) : null}
          </div>
        )}
        {block.address ? (
          <p className="whitespace-pre-line break-words text-[17px] leading-relaxed">
            {block.address}
            {map && map !== "#" ? (
              <>
                {" "}
                <a
                  href={map}
                  target={isExternalHref(map) ? "_blank" : undefined}
                  rel={isExternalHref(map) ? "noopener noreferrer" : undefined}
                  className="font-semibold underline underline-offset-4"
                >
                  Open map
                </a>
              </>
            ) : null}
          </p>
        ) : null}
        {hours.length > 0 ? (
          <dl className="grid max-w-sm grid-cols-[auto_1fr] gap-x-6 gap-y-1.5 text-[15px]">
            {hours.map((h, i) => (
              <div key={i} className="contents">
                <dt className={cn("font-medium", muted)}>{h.day}</dt>
                <dd className="tabular-nums">{h.time}</dd>
              </div>
            ))}
          </dl>
        ) : null}
      </div>
      {qr ? (
        <figure className="flex flex-col items-center gap-2">
          <svg
            role="img"
            aria-label="QR code"
            viewBox={`0 0 ${qr.size} ${qr.size}`}
            className="h-40 w-40 rounded-xl bg-white p-1 shadow-ws-sm"
            shapeRendering="crispEdges"
          >
            <rect width={qr.size} height={qr.size} fill="#fff" />
            <path d={qr.path} fill="#111" />
          </svg>
          <figcaption className={cn("text-xs", muted)}>Scan with your phone</figcaption>
        </figure>
      ) : null}
    </div>
  );
}
