"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Sparkles, Send, Loader2 } from "lucide-react";
import { createSiteFromWizard } from "@/app/dashboard/actions";
import { askAgent } from "@/lib/ai-agent";
import { EXTRACT, parseBrief } from "@/components/wizard/agent-chat";
import { ACCENTS, ACCENT_META, SITE_TYPES, TYPE_PRESETS, defaultInput, type SiteType, type WizardInput } from "@/lib/wizard";
import type { BlockAccent } from "@/lib/types/blocks";

const TYPE_AR: Record<SiteType, string> = {
  business: "شركة / خدمات", portfolio: "معرض أعمال", shop: "متجر", restaurant: "مطعم / كافيه",
  event: "مناسبة / فعالية", personal: "موقع شخصي", agency: "وكالة", nonprofit: "مبادرة / جمعية",
};
const ACCENT_AR: Record<string, string> = { indigo: "نحاسي", oxide: "أزرق", sunset: "غروب", forest: "أخضر", ocean: "سماوي", rose: "وردي", mono: "رمادي" };
const LOOK_AR = [
  { id: "spotlight", label: "داكن ودراماتيكي" },
  { id: "airy", label: "فاتح وهادي" },
  { id: "bold", label: "ملوّن وجريء" },
] as const;

type StepId = "type" | "name" | "story" | "phone" | "address" | "look" | "accent";
const STEPS: { id: StepId; q: string; optional?: boolean }[] = [
  { id: "type", q: "أهلاً! أنا هبني موقعك معاك. أول حاجة: نشاطك أقرب لإيه؟" },
  { id: "name", q: "حلو. اسم نشاطك إيه؟" },
  { id: "story", q: "احكيلي عن شغلك في جملتين: بتقدّم إيه ولمين؟" },
  { id: "phone", q: "رقم الواتساب اللي العملاء يكلموك عليه؟", optional: true },
  { id: "address", q: "فين مكانك؟ (المدينة أو العنوان)", optional: true },
  { id: "look", q: "تحب الموقع يبان إزاي؟" },
  { id: "accent", q: "آخر سؤال: لون الموقع الأساسي؟" },
];

interface Bubble { from: "bot" | "me"; text: string }

/** Chat-style onboarding: one question at a time, then the AI writes the copy and the site is built. */
export function AiOnboarding() {
  const router = useRouter();
  const [i, setI] = useState(0);
  const [input, setInput] = useState<WizardInput>(() => defaultInput("business"));
  const [story, setStory] = useState("");
  const [bubbles, setBubbles] = useState<Bubble[]>([{ from: "bot", text: STEPS[0].q }]);
  const [text, setText] = useState("");
  const [building, setBuilding] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const end = useRef<HTMLDivElement>(null);

  useEffect(() => { end.current?.scrollIntoView({ behavior: "smooth", block: "end" }); }, [bubbles, building]);

  const step = i < STEPS.length ? STEPS[i] : null;

  function advance(patch: Partial<WizardInput>, shown: string, extra?: { story?: string }) {
    const next = { ...input, ...patch };
    setInput(next);
    if (extra?.story !== undefined) setStory(extra.story);
    const n = i + 1;
    const add: Bubble[] = [{ from: "me", text: shown }];
    if (n < STEPS.length) add.push({ from: "bot", text: STEPS[n].q });
    setBubbles((b) => [...b, ...add]);
    setText("");
    setI(n);
    if (n >= STEPS.length) void build(next, extra?.story ?? story);
  }

  async function build(base: WizardInput, storyText: string) {
    setError(null);
    setBuilding("بكتب محتوى موقعك…");
    let data = base;
    try {
      const brief = parseBrief(await askAgent([
        { role: "user", content: `النشاط: ${TYPE_AR[base.type]}. الاسم: ${base.name}. ${storyText}\n\n${EXTRACT} Set name to "${base.name}".` },
      ]));
      if (brief) data = { ...base, ...brief, name: base.name, type: base.type, phone: base.phone || brief.phone || "", address: base.address || brief.address || "" };
    } catch { /* the preset copy is a fine starting point; the owner edits it next */ }
    setBuilding("بركّب الأقسام والألوان…");
    const res = await createSiteFromWizard({ ...data, slug: "" });
    if (res.error || !res.slug) {
      setError(res.error ?? "معرفتش أكمّل البناء. جرّب تاني.");
      setBuilding(null);
      setI(STEPS.length - 1);
      return;
    }
    setBuilding("جاهز! بفتحلك المحرر…");
    router.push(`/dashboard/sites/${res.slug}`);
  }

  const Chip = ({ label, onClick, swatch }: { label: string; onClick: () => void; swatch?: string }) => (
    <button type="button" onClick={onClick}
      className="inline-flex min-h-11 items-center gap-2 rounded-full border border-line bg-white px-4 py-2 text-sm font-semibold text-ink active:scale-95">
      {swatch ? <span className="size-4 rounded-full" style={{ background: swatch }} aria-hidden /> : null}{label}
    </button>
  );

  const submitText = () => {
    const t = text.trim();
    if (!step || !t) return;
    if (step.id === "name") advance({ name: t.slice(0, 80) }, t);
    else if (step.id === "story") advance({ about: t.slice(0, 600) }, t, { story: t });
    else if (step.id === "phone") advance({ phone: t.slice(0, 30) }, t);
    else if (step.id === "address") advance({ address: t.slice(0, 160) }, t);
  };
  const textStep = step && ["name", "story", "phone", "address"].includes(step.id);

  return (
    <div dir="rtl" className="fixed inset-0 z-40 flex flex-col bg-canvas text-ink">
      <header className="flex items-center gap-2 border-b border-line px-4 py-3">
        <Sparkles className="size-5 text-orange" aria-hidden />
        <h1 className="text-base font-bold">ابني موقعك مع WebSide</h1>
        <span className="ms-auto text-xs text-muted">{Math.min(i + 1, STEPS.length)} / {STEPS.length}</span>
      </header>
      <div className="h-1 bg-line"><div className="h-full bg-orange transition-all" style={{ width: `${(Math.min(i, STEPS.length) / STEPS.length) * 100}%` }} /></div>

      <div className="flex-1 space-y-3 overflow-y-auto px-4 py-4">
        {bubbles.map((b, k) => (
          <p key={k} className={b.from === "bot"
            ? "me-10 w-fit max-w-[85%] rounded-2xl rounded-ss-sm bg-orange/10 px-4 py-3 text-[15px] leading-relaxed"
            : "ms-auto me-10 w-fit max-w-[85%] rounded-2xl rounded-se-sm bg-ink px-4 py-3 text-[15px] text-canvas"}>{b.text}</p>
        ))}
        {building ? <p className="inline-flex items-center gap-2 text-sm text-muted"><Loader2 className="size-4 animate-spin" aria-hidden />{building}</p> : null}
        {error ? <p role="alert" className="rounded-xl bg-danger-soft px-3 py-2 text-sm text-danger">{error}</p> : null}
        <div ref={end} />
      </div>

      {!building && step ? (
        <div className="border-t border-line bg-surface p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
          {step.id === "type" ? (
            <div className="flex flex-wrap gap-2">
              {SITE_TYPES.map((t) => <Chip key={t} label={TYPE_AR[t]} onClick={() => {
                const d = defaultInput(t);
                advance({ type: t, tagline: d.tagline, about: TYPE_PRESETS[t].about, offerings: d.offerings }, TYPE_AR[t]);
              }} />)}
            </div>
          ) : null}
          {step.id === "look" ? (
            <div className="flex flex-wrap gap-2">{LOOK_AR.map((l) => <Chip key={l.id} label={l.label} onClick={() => advance({ look: l.id }, l.label)} />)}</div>
          ) : null}
          {step.id === "accent" ? (
            <div className="flex flex-wrap gap-2">{ACCENTS.map((a) => <Chip key={a} label={ACCENT_AR[a] ?? ACCENT_META[a].label} swatch={ACCENT_META[a].swatch}
              onClick={() => advance({ accent: a as BlockAccent }, ACCENT_AR[a] ?? ACCENT_META[a].label)} />)}</div>
          ) : null}
          {textStep ? (
            <form onSubmit={(e) => { e.preventDefault(); submitText(); }} className="flex items-end gap-2">
              {step.id === "story"
                ? <textarea autoFocus value={text} onChange={(e) => setText(e.target.value)} rows={3} maxLength={600} placeholder="اكتب هنا…" className="min-w-0 flex-1 rounded-xl border border-line bg-white px-3 py-2 text-base" />
                : <input autoFocus value={text} onChange={(e) => setText(e.target.value)} maxLength={160} inputMode={step.id === "phone" ? "tel" : "text"} placeholder="اكتب هنا…" className="min-w-0 flex-1 rounded-xl border border-line bg-white px-3 py-3 text-base" />}
              <button type="submit" disabled={!text.trim()} aria-label="إرسال" className="grid size-12 shrink-0 place-items-center rounded-xl bg-orange text-white disabled:opacity-40"><Send className="size-5 rtl:-scale-x-100" aria-hidden /></button>
            </form>
          ) : null}
          {step.optional ? <button type="button" onClick={() => advance({}, "تخطّي")} className="mt-2 min-h-11 w-full text-sm font-semibold text-muted">تخطّي السؤال ده</button> : null}
        </div>
      ) : null}
    </div>
  );
}
