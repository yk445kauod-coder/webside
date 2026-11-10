"use client";

import { useRef, useState } from "react";
import { Sparkles, Send } from "lucide-react";
import { askAgent, type AgentMessage } from "@/lib/ai-agent";

const HELLO: AgentMessage = { role: "assistant", content: "أنا مساعد WebSide. احكيلي شغلك في جملتين وأنا أساعدك تختار الشكل والأقسام المناسبة." };

/** Smart onboarding agent: a short chat that helps the owner describe the business. */
export function AgentChat() {
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
      <form onSubmit={(e) => { e.preventDefault(); void send(); }} className="flex gap-2 border-t border-line p-3">
        <input value={text} onChange={(e) => setText(e.target.value)} maxLength={500} placeholder="اكتب هنا…"
          className="min-w-0 flex-1 rounded-lg border border-line bg-white px-3 py-2 text-base" />
        <button type="submit" disabled={busy || !text.trim()} aria-label="إرسال"
          className="grid size-11 place-items-center rounded-lg bg-orange text-white disabled:opacity-50"><Send className="size-4 rtl:-scale-x-100" aria-hidden /></button>
      </form>
    </div>
  );
}
