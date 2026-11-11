"use client";

import { useEffect, useRef, useState } from "react";
import { listSlots, renderTemplate, type TemplateProps } from "@/lib/template-site";

/**
 * Edits a whole ready-made template in place: the page is shown exactly as designed, and any text can be
 * clicked and typed over. Images are changed from the Images panel (or by tapping one). The frame is
 * sandboxed, so the template's own scripts and animations run but can't reach the editor.
 */
export function TemplateCanvas({ props, onChange }: { props: TemplateProps; onChange: (p: TemplateProps) => void }) {
  const frame = useRef<HTMLIFrameElement>(null);
  const latest = useRef(props);
  const [doc, setDoc] = useState(() => renderTemplate(props.templateKey, props, true));
  const [panel, setPanel] = useState(false);
  const [device, setDevice] = useState<"desktop" | "mobile">("desktop");
  const [slots] = useState(() => listSlots(props.templateKey).images);

  useEffect(() => {
    latest.current = props;
  });

  useEffect(() => {
    function onMessage(e: MessageEvent) {
      if (e.source !== frame.current?.contentWindow) return;
      const d = e.data as { ws?: number; t?: string; id?: number; v?: string } | null;
      if (!d || d.ws !== 1 || typeof d.id !== "number") return;
      const cur = latest.current;
      if (d.t === "text" && typeof d.v === "string") {
        onChange({ ...cur, texts: { ...cur.texts, [d.id]: d.v.slice(0, 2000) } });
      } else if (d.t === "img") {
        setPanel(true);
      }
    }
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, [onChange]);

  function setImage(i: number, url: string) {
    const cur = latest.current;
    const next = { ...cur, images: { ...cur.images, [i]: url.trim() } };
    onChange(next);
    setDoc(renderTemplate(next.templateKey, next, true));
  }

  return (
    <div className="absolute inset-0 flex flex-col bg-[#F4F1EC]" dir="rtl">
      <div className="flex h-11 shrink-0 items-center justify-between gap-2 border-b border-line bg-surface px-3 text-sm">
        <p className="truncate text-muted">اضغط على أي نص في الصفحة واكتب مكانه.</p>
        <div className="flex shrink-0 items-center gap-1.5">
          <div className="hidden overflow-hidden rounded-lg border border-line sm:flex" role="group" aria-label="حجم المعاينة">
            {(["desktop", "mobile"] as const).map((d) => (
              <button
                key={d}
                type="button"
                onClick={() => setDevice(d)}
                aria-pressed={device === d}
                className={"px-3 py-1 text-xs font-medium " + (device === d ? "bg-ink text-white" : "text-muted hover:text-ink")}
              >
                {d === "desktop" ? "كمبيوتر" : "موبايل"}
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={() => setPanel((o) => !o)}
            aria-expanded={panel}
            className="rounded-lg border border-line px-3 py-1 text-xs font-semibold text-ink hover:border-ink"
          >
            الصور
          </button>
        </div>
      </div>

      <div className="relative flex min-h-0 flex-1 justify-center overflow-auto">
        <iframe
          ref={frame}
          title="Template editor"
          srcDoc={doc}
          sandbox="allow-scripts"
          className={"h-full border-0 bg-white " + (device === "mobile" ? "w-[390px] shadow-ws" : "w-full")}
        />
        {panel ? (
          <aside className="absolute inset-y-0 start-0 z-10 flex w-full max-w-sm flex-col border-e border-line bg-surface shadow-ws">
            <div className="flex items-center justify-between border-b border-line px-4 py-3">
              <h2 className="text-sm font-semibold text-ink">صور القالب</h2>
              <button type="button" onClick={() => setPanel(false)} className="text-sm text-muted hover:text-ink">
                إغلاق
              </button>
            </div>
            <p className="px-4 pt-3 text-xs text-muted">الصق رابط الصورة الجديدة (يبدأ بـ https) واضغط خارج الخانة.</p>
            <ul className="ws-scroll min-h-0 flex-1 divide-y divide-line overflow-y-auto">
              {slots.slice(0, 40).map((orig, i) => {
                const cur = props.images[i] || orig;
                return (
                  <li key={i} className="flex items-center gap-3 px-4 py-3">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={cur} alt="" className="h-12 w-16 shrink-0 rounded-md border border-line bg-canvas object-cover" />
                    <input
                      dir="ltr"
                      type="url"
                      defaultValue={props.images[i] ?? ""}
                      placeholder="https://…"
                      aria-label={`Image ${i + 1} URL`}
                      onBlur={(e) => {
                        const v = e.target.value.trim();
                        if (v !== (props.images[i] ?? "")) setImage(i, v);
                      }}
                      className="min-w-0 flex-1 rounded-lg border border-line bg-canvas px-2 py-1.5 text-xs text-ink"
                    />
                  </li>
                );
              })}
            </ul>
          </aside>
        ) : null}
      </div>
    </div>
  );
}
