"use client";

import { useRef, useState } from "react";
import { Sparkles, Send } from "lucide-react";
import { askAgent, type AgentMessage } from "@/lib/ai-agent";
import { SITE_TYPES, type WizardInput } from "@/lib/wizard";

const EXTRACT = 'Return ONLY a JSON object, no prose, with keys: type (one of ' + SITE_TYPES.join("|") + '), name, tagline, about, phone, address, offerings (array of up to 6 {heading,text}). Use "" for anything the owner did not say. Write values in the owner\'s language.';

function parseBrief(raw: string): Partial<WizardInput> | null {
  const m = raw.match(/\{[\s\S]*\}/);
  if (!m) return null;
  try {
    const j = JSON.parse(m[0]) as Record<string, unknown>;
    const s = (v: unknown, n: number) => (typeof v === "string" ? v.trim().slice(0, n) : "");
    const out: Partial<WizardInput> = {};
    if (typeof j.type === "string" && (SITE_TYPES as readonly string[]).includes(j.type)) out.type = j.type as WizardInput["type"];
    if (s(j.name, 80)) out.name = s(j.name, 80);
    if (s(j.tagline, 140)) out.tagline = s(j.tagline, 140);
    if (s(j.about, 600)) out.about = s(j.about, 600);
    if (s(j.phone, 30)) out.phone = s(j.phone, 30);
    if (s(j.address, 160)) out.address = s(j.address, 160);
    if (Array.isArray(j.offerings)) {
      const o = j.offerings.slice(0, 6).map((x) => ({ heading: s((x as Record<string, unknown>)?.heading, 80), text: s((x as Record<string, unknown>)?.text, 200) })).filter((x) => x.heading);
      if (o.length) out.offerings = o;
    }
    return Object.keys(out).length ? out : null;
  } catch {
    return null;
  }
}

const HELLO: AgentMessage = { role: "assistant", content: "أنا مساعد WebSide. احكيلي شغلك في جملتين وأنا أساعدك تختار الشكل والأقسام المناسبة." };

/** Smart onboarding agent: a short chat that helps the owner describe the business. */
export function AgentChat({ onApply }: { onApply?: (patch: Partial<WizardInput>) => void }) {
  const [open, setOpen] = useState(false);
  const [msgs, setMsgs] = useState<AgentMessage[]>([HELLO]);
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const end = useRef<HTMLDivElement>(null);

  async function send() {
    const t = text.trim();
    if (!t || busy) return;
    const next = [...msgs, { role: "user" as const, content: t }];
    setMsgs(next); setText(""); setBusy(true); setErr(null);
    try {
      const reply = await askAgent(next.filter((m) => m !== HELLO));
      setMsgs([...next, { role: "assistant", content: reply }]);
    } catch (e) {
      setErr((e as Error).message === "rate" ? "استنى لحظة وجرّب تاني." : "المساعد مش متاح دلوقتي، كمّل بالخطوات العادية.");
    } finally {
      setBusy(false);
      setTimeout(() => end.current?.scrollIntoView({ behavior: "smooth" }), 50);
    }
  }

  async function build() {
    if (busy) return;
    setBusy(true); setErr(null);
    try {
      const raw = await askAgent([...msgs.filter((m) => m !== HELLO), { role: "user", content: EXTRACT }]);
      const brief = parseBrief(raw);
      if (!brief) throw new Error("parse");
      onApply?.(brief);
      setMsgs((p) => [...p, { role: "assistant", content: "تمام، ملّيت بيانات موقعك في الخطوات. راجعها وكمّل." }]);
    } catch {
      setErr("ما قدرتش أطلّع بيانات كفاية. احكيلي أكتر عن شغلك وجرّب تاني.");
    } finally {
      setBusy(false);
    }
  }

  if (!open) {
    return (
      <button type="button" onClick={() => setOpen(true)}
        className="fixed bottom-4 end-4 z-40 inline-flex items-center gap-2 rounded-full bg-ink px-4 py-3 text-sm font-semibold text-canvas shadow-lg">
        <Sparkles className="size-4 text-orange" aria-hidden /> مساعد WebSide
      </button>
    );
  }
  return (
    <div dir="rtl" role="dialog" aria-label="مساعد WebSide"
      className="fixed inset-x-3 bottom-3 z-40 flex max-h-[70dvh] flex-col rounded-2xl border border-line bg-canvas shadow-2xl sm:inset-x-auto sm:end-4 sm:w-96">
      <div className="flex items-center justify-between border-b border-line px-4 py-3">
        <span className="inline-flex items-center gap-2 text-sm font-semibold"><Sparkles className="size-4 text-orange" aria-hidden /> مساعد WebSide</span>
        <button type="button" onClick={() => setOpen(false)} className="text-sm text-muted" aria-label="إغلاق">إغلاق</button>
      </div>
      <div className="flex-1 space-y-2 overflow-y-auto p-4">
        {msgs.map((m, i) => (
          <p key={i} className={m.role === "user" ? "ms-8 rounded-xl bg-ink px-3 py-2 text-sm text-canvas" : "me-8 rounded-xl bg-orange/10 px-3 py-2 text-sm"}>{m.content}</p>
        ))}
        {busy ? <p className="text-sm text-muted">بكتب…</p> : null}
        {err ? <p className="text-sm text-danger" role="alert">{err}</p> : null}
        <div ref={end} />
      </div>
      {onApply && msgs.filter((m) => m.role === "user").length >= 2 ? (
        <button type="button" onClick={() => void build()} disabled={busy} className="mx-3 mb-1 rounded-lg bg-ink px-3 py-2 text-sm font-semibold text-canvas disabled:opacity-50">
          جهّز موقعي من كلامنا
        </button>
      ) : null}
      <form onSubmit={(e) => { e.preventDefault(); void send(); }} className="flex gap-2 border-t border-line p-3">
        <input value={text} onChange={(e) => setText(e.target.value)} maxLength={500} placeholder="اكتب هنا…"
          className="min-w-0 flex-1 rounded-lg border border-line bg-white px-3 py-2 text-base" />
        <button type="submit" disabled={busy || !text.trim()} aria-label="إرسال"
          className="grid size-11 place-items-center rounded-lg bg-orange text-white disabled:opacity-50"><Send className="size-4 rtl:-scale-x-100" aria-hidden /></button>
      </form>
    </div>
  );
}
