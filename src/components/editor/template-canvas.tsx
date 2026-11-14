"use client";

import { useEffect, useRef, useState } from "react";
import { Loader2, Send } from "lucide-react";
import { listSlots, renderTemplate, type TemplateProps } from "@/lib/template-site";
import { FONTS, fontsLink, menuCount, parseBulk, sanitizeCss, type TemplateMenu } from "@/lib/template-extras";
import { applyTplOps, parseTplReply, templatePrompt } from "@/lib/template-agent";
import { askAgent, type AgentMessage } from "@/lib/ai-agent";

type Tab = "images" | "fonts" | "menu" | "ai";
const TABS: [Tab, string][] = [["ai", "المساعد"], ["fonts", "الخطوط"], ["menu", "المنيو"], ["images", "الصور"]];
const EMPTY_MENU: TemplateMenu = { title: "", currency: "", categories: [] };

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
  const [tab, setTab] = useState<Tab>("ai");
  const [device, setDevice] = useState<"desktop" | "mobile">("desktop");
  const [slots] = useState(() => listSlots(props.templateKey));
  const [chat, setChat] = useState<(AgentMessage & { done?: number })[]>([{ role: "assistant", content: "قولّي أعدّل إيه: نصوص، خط، ألوان، أو ضيف أصناف للمنيو." }]);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [bulk, setBulk] = useState("");
  const [q, setQ] = useState("");

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
        setTab("images");
        setPanel(true);
      }
    }
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, [onChange]);

  function apply(next: TemplateProps) {
    latest.current = next;
    onChange(next);
    setDoc(renderTemplate(next.templateKey, next, true));
  }

  async function send(t: string) {
    t = t.trim();
    if (!t || busy) return;
    setChat((m) => [...m, { role: "user", content: t }]);
    setQ("");
    setBusy(true);
    setErr(null);
    try {
      const hist = chat.slice(1).map(({ role, content }) => ({ role, content }));
      const raw = await askAgent([...hist, { role: "user", content: `${templatePrompt(slots.texts, latest.current)}\n\nOwner request: ${t}` }], undefined, "editor");
      const { reply, ops } = parseTplReply(raw);
      const res = applyTplOps(latest.current, ops, slots.texts.length, slots.images.length);
      if (res.applied) apply(res.props);
      setChat((m) => [...m, { role: "assistant", content: reply, done: res.applied }]);
    } catch (e) {
      setErr((e as Error).message === "rate" ? "استنى لحظة وجرّب تاني." : "المساعد مش متاح دلوقتي. تقدر تعدّل بإيدك.");
    } finally {
      setBusy(false);
    }
  }

  const menu = props.menu ?? EMPTY_MENU;
  const setMenu = (m: TemplateMenu) => apply({ ...latest.current, menu: m.categories.some((c) => c.items.length) ? m : undefined });

  function setImage(i: number, url: string) {
    const cur = latest.current;
    const next = { ...cur, images: { ...cur.images, [i]: url.trim() } };
    apply(next);
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
            className="rounded-lg bg-orange px-3 py-1 text-xs font-semibold text-white"
          >
            أدوات
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
            <link rel="stylesheet" href={fontsLink(FONTS.map((f) => f.name))} />
            <div className="flex items-center justify-between gap-1 border-b border-line px-2 py-2">
              <div className="flex gap-1" role="tablist">
                {TABS.map(([k, label]) => (
                  <button key={k} type="button" role="tab" aria-selected={tab === k} onClick={() => setTab(k)}
                    className={"min-h-10 rounded-lg px-3 text-sm font-semibold " + (tab === k ? "bg-ink text-white" : "text-muted")}>
                    {label}
                  </button>
                ))}
              </div>
              <button type="button" onClick={() => setPanel(false)} className="min-h-10 px-2 text-sm text-muted hover:text-ink">إغلاق</button>
            </div>

            {tab === "ai" ? (
              <div className="flex min-h-0 flex-1 flex-col">
                <div className="min-h-0 flex-1 space-y-2 overflow-y-auto p-3">
                  {chat.map((m, i) => (
                    <div key={i} className={m.role === "user" ? "ms-8" : "me-8"}>
                      <p className={m.role === "user" ? "rounded-xl bg-ink px-3 py-2 text-sm text-canvas" : "rounded-xl bg-orange/10 px-3 py-2 text-sm"}>{m.content}</p>
                      {m.done ? <p className="mt-1 text-xs text-muted">اتنفّذ {m.done} تعديل</p> : null}
                    </div>
                  ))}
                  {chat.length === 1 ? (
                    <div className="flex flex-wrap gap-2">
                      {["غيّر الخط لـ Cairo", "خلّي الخلفية داكنة", "ضيف 5 أصناف قهوة للمنيو", "اكتب عنوان أحسن"].map((h) => (
                        <button key={h} type="button" onClick={() => void send(h)} className="min-h-10 rounded-full border border-line bg-white px-3 text-xs font-semibold">{h}</button>
                      ))}
                    </div>
                  ) : null}
                  {busy ? <p className="inline-flex items-center gap-2 text-sm text-muted"><Loader2 className="size-4 animate-spin" aria-hidden />بنفّذ…</p> : null}
                  {err ? <p role="alert" className="text-sm text-danger">{err}</p> : null}
                </div>
                <form onSubmit={(e) => { e.preventDefault(); void send(q); }} className="flex gap-2 border-t border-line p-2">
                  <input value={q} onChange={(e) => setQ(e.target.value)} maxLength={300} placeholder="اطلب تعديل…" className="min-w-0 flex-1 rounded-xl border border-line bg-white px-3 py-2.5 text-base" />
                  <button type="submit" disabled={busy || !q.trim()} aria-label="إرسال" className="grid size-11 place-items-center rounded-xl bg-orange text-white disabled:opacity-40">
                    <Send className="size-5 rtl:-scale-x-100" aria-hidden />
                  </button>
                </form>
              </div>
            ) : null}

            {tab === "fonts" ? (
              <div className="ws-scroll min-h-0 flex-1 space-y-4 overflow-y-auto p-3">
                {(["heading", "body"] as const).map((k) => (
                  <div key={k}>
                    <h3 className="mb-2 text-sm font-semibold text-ink">{k === "heading" ? "خط العناوين" : "خط النصوص"}</h3>
                    <div className="grid grid-cols-2 gap-2">
                      <button type="button" onClick={() => { const f = { ...(props.fonts ?? {}) }; delete f[k]; apply({ ...latest.current, fonts: f }); }}
                        className={"min-h-12 rounded-xl border px-2 text-sm " + (!props.fonts?.[k] ? "border-orange bg-orange/10" : "border-line")}>
                        الأصلي
                      </button>
                      {FONTS.map((f) => (
                        <button key={f.name} type="button" style={{ fontFamily: `'${f.name}', sans-serif` }}
                          onClick={() => apply({ ...latest.current, fonts: { ...(latest.current.fonts ?? {}), [k]: f.name } })}
                          className={"min-h-12 rounded-xl border px-2 text-base " + (props.fonts?.[k] === f.name ? "border-orange bg-orange/10" : "border-line")}>
                          {f.ar ? "أبجد " : "Aa "}
                          <span className="text-xs">{f.name}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
                <div>
                  <h3 className="mb-2 text-sm font-semibold text-ink">CSS مخصص (للمتقدمين)</h3>
                  <textarea dir="ltr" defaultValue={props.css ?? ""} rows={4} placeholder="h1 { color: #FD6B47; }"
                    onBlur={(e) => apply({ ...latest.current, css: sanitizeCss(e.target.value) })}
                    className="w-full rounded-xl border border-line bg-white p-2 font-mono text-xs" />
                </div>
              </div>
            ) : null}

            {tab === "menu" ? (
              <div className="ws-scroll min-h-0 flex-1 space-y-3 overflow-y-auto p-3">
                <p className="text-xs text-muted">المنيو بيتضاف كقسم في الصفحة: جريد بسكرول وبحث وتصنيفات. {menuCount(props.menu)} صنف حاليًا.</p>
                <div className="flex gap-2">
                  <input value={menu.title} onChange={(e) => setMenu({ ...menu, title: e.target.value.slice(0, 80) })} placeholder="عنوان القسم" className="min-w-0 flex-1 rounded-lg border border-line bg-white px-2 py-2 text-sm" />
                  <input value={menu.currency} onChange={(e) => setMenu({ ...menu, currency: e.target.value.slice(0, 10) })} placeholder="العملة" className="w-20 rounded-lg border border-line bg-white px-2 py-2 text-sm" />
                </div>
                <label className="block text-xs font-semibold text-ink">إضافة بالجملة (سطر لكل صنف: الاسم | السعر | الوصف — وسطر # للتصنيف)</label>
                <textarea value={bulk} onChange={(e) => setBulk(e.target.value)} rows={6} placeholder={"# مشروبات\nكابتشينو | 65 | حليب مبخر\nإسبريسو | 45"} className="w-full rounded-xl border border-line bg-white p-2 text-sm" />
                <button type="button" disabled={!bulk.trim()} onClick={() => { setMenu(parseBulk(bulk, menu)); setBulk(""); }} className="min-h-11 w-full rounded-xl bg-ink px-3 text-sm font-semibold text-white disabled:opacity-40">أضف للمنيو</button>
                {menu.categories.map((c, ci) => (
                  <details key={ci} className="rounded-xl border border-line">
                    <summary className="min-h-11 cursor-pointer px-3 py-2.5 text-sm font-semibold">{c.name || "بدون تصنيف"} ({c.items.length})</summary>
                    <ul className="max-h-72 divide-y divide-line overflow-y-auto">
                      {c.items.map((it, ii) => (
                        <li key={ii} className="flex items-center gap-2 px-3 py-2 text-sm">
                          <span className="min-w-0 flex-1 truncate">{it.name}</span>
                          <span className="shrink-0 text-muted">{it.price}</span>
                          <button type="button" aria-label="حذف" onClick={() => setMenu({ ...menu, categories: menu.categories.map((x, xi) => (xi === ci ? { ...x, items: x.items.filter((_, k) => k !== ii) } : x)) })} className="grid size-9 place-items-center rounded-lg text-danger">✕</button>
                        </li>
                      ))}
                    </ul>
                  </details>
                ))}
              </div>
            ) : null}

            {tab === "images" ? (
              <>
                <p className="px-4 pt-3 text-xs text-muted">الصق رابط الصورة الجديدة (يبدأ بـ https) واضغط خارج الخانة.</p>
                <ul className="ws-scroll min-h-0 flex-1 divide-y divide-line overflow-y-auto">
                  {slots.images.slice(0, 40).map((orig, i) => {
                    const cur = props.images[i] || orig;
                    return (
                      <li key={i} className="flex items-center gap-3 px-4 py-3">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={cur} alt="" className="h-12 w-16 shrink-0 rounded-md border border-line bg-canvas object-cover" />
                        <input dir="ltr" type="url" defaultValue={props.images[i] ?? ""} placeholder="https://…" aria-label={`Image ${i + 1} URL`}
                          onBlur={(e) => { const v = e.target.value.trim(); if (v !== (props.images[i] ?? "")) setImage(i, v); }}
                          className="min-w-0 flex-1 rounded-lg border border-line bg-canvas px-2 py-1.5 text-xs text-ink" />
                      </li>
                    );
                  })}
                </ul>
              </>
            ) : null}
          </aside>
        ) : null}
      </div>
    </div>
  );
}
