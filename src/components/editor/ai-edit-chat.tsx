"use client";

import { useEffect, useRef, useState } from "react";
import { Send, Sparkles, Loader2 } from "lucide-react";
import { askAgent, type AgentMessage } from "@/lib/ai-agent";
import { applyOps, parseReply, systemPrompt, type Item } from "@/lib/site-agent";

const HINTS = ["غيّر لون الموقع للأحمر الوردي", "ضيف قسم أسئلة شائعة", "اكتب عنوان أحسن للصفحة الرئيسية", "رتّب الأقسام: الاتصال في الآخر"];

/** Chat with the site: the agent answers with JSON ops that are applied to the page the owner is editing. */
export function AiEditChat({ items, onItems }: { items: Item[]; onItems: (next: Item[]) => void }) {
  const [msgs, setMsgs] = useState<(AgentMessage & { done?: number })[]>([
    { role: "assistant", content: "قولّي عايز تعدّل إيه في موقعك وأنا أنفّذه: نصوص، أقسام، ألوان، خطوط." },
  ]);
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const end = useRef<HTMLDivElement>(null);
  const latest = useRef(items);
  useEffect(() => { latest.current = items; }, [items]);

  async function send(t: string) {
    t = t.trim();
    if (!t || busy) return;
    setMsgs((m) => [...m, { role: "user", content: t }]);
    setText(""); setBusy(true); setErr(null);
    try {
      const history = msgs.slice(1).map(({ role, content }) => ({ role, content }));
      // The page description goes in the same message so the agent always sees the current page.
      const raw = await askAgent([...history, { role: "user", content: `${systemPrompt(latest.current)}\n\nOwner request: ${t}` }]);
      const { reply, ops } = parseReply(raw);
      const res = applyOps(latest.current, ops);
      if (res.applied) onItems(res.items);
      setMsgs((m) => [...m, { role: "assistant", content: reply, done: res.applied }]);
    } catch (e) {
      setErr((e as Error).message === "rate" ? "استنى لحظة وجرّب تاني." : "المساعد مش متاح دلوقتي. تقدر تعدّل بإيدك من الأدوات.");
    } finally {
      setBusy(false);
      setTimeout(() => end.current?.scrollIntoView({ behavior: "smooth", block: "end" }), 50);
    }
  }

  return (
    <div dir="rtl" className="flex h-full min-h-0 flex-col">
      <div className="min-h-0 flex-1 space-y-2 overflow-y-auto p-3">
        {msgs.map((m, i) => (
          <div key={i} className={m.role === "user" ? "ms-8" : "me-8"}>
            <p className={m.role === "user" ? "rounded-xl bg-ink px-3 py-2 text-sm text-canvas" : "rounded-xl bg-orange/10 px-3 py-2 text-sm"}>{m.content}</p>
            {m.done ? <p className="mt-1 text-xs text-muted">اتنفّذ {m.done} تعديل</p> : null}
          </div>
        ))}
        {msgs.length === 1 ? (
          <div className="flex flex-wrap gap-2 pt-1">
            {HINTS.map((h) => (
              <button key={h} type="button" onClick={() => void send(h)} className="min-h-10 rounded-full border border-line bg-white px-3 text-xs font-semibold">{h}</button>
            ))}
          </div>
        ) : null}
        {busy ? <p className="inline-flex items-center gap-2 text-sm text-muted"><Loader2 className="size-4 animate-spin" aria-hidden />بنفّذ…</p> : null}
        {err ? <p role="alert" className="text-sm text-danger">{err}</p> : null}
        <div ref={end} />
      </div>
      <form onSubmit={(e) => { e.preventDefault(); void send(text); }} className="flex gap-2 border-t border-line p-2">
        <input value={text} onChange={(e) => setText(e.target.value)} maxLength={300} placeholder="اطلب تعديل…"
          className="min-w-0 flex-1 rounded-xl border border-line bg-white px-3 py-2.5 text-base" />
        <button type="submit" disabled={busy || !text.trim()} aria-label="إرسال" className="grid size-11 place-items-center rounded-xl bg-orange text-white disabled:opacity-40">
          <Send className="size-5 rtl:-scale-x-100" aria-hidden />
        </button>
      </form>
    </div>
  );
}

export { Sparkles };
