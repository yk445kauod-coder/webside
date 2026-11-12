"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Sparkles, Send, Loader2 } from "lucide-react";
import { createTemplateSite } from "@/app/dashboard/actions";
import { fillTemplate } from "@/lib/template-fill";
import { TEMPLATE_CATALOG } from "@/lib/template-site";

const TYPES = [
  { id: "restaurant", label: "مطعم / كافيه", tpl: ["restaurant", "cafe", "bakery"] },
  { id: "shop", label: "متجر", tpl: ["shop", "jewellery"] },
  { id: "salon", label: "صالون / عناية", tpl: ["salon"] },
  { id: "clinic", label: "عيادة / طب", tpl: ["clinic"] },
  { id: "gym", label: "جيم / رياضة", tpl: ["gym"] },
  { id: "business", label: "شركة / خدمات", tpl: ["agency", "clinic", "portfolio"] },
  { id: "portfolio", label: "معرض أعمال / شخصي", tpl: ["portfolio", "agency"] },
] as const;

type StepId = "type" | "template" | "name" | "story" | "phone" | "address" | "lang";
const STEPS: { id: StepId; q: string; optional?: boolean }[] = [
  { id: "type", q: "أهلاً! هبني موقعك معاك على قالب جاهز بتصميم احترافي. نشاطك أقرب لإيه؟" },
  { id: "template", q: "اختار القالب اللي عجبك. التصميم والألوان والحركة هتفضل زي ما هي، وأنا هكتب المحتوى بتاعك جواه." },
  { id: "name", q: "حلو. اسم نشاطك إيه؟" },
  { id: "story", q: "احكيلي عن شغلك في جملتين: بتقدّم إيه ولمين؟ (الأسعار والمميزات تنفع)" },
  { id: "phone", q: "رقم الواتساب اللي العملاء يكلموك عليه؟", optional: true },
  { id: "address", q: "فين مكانك؟ (المدينة أو العنوان)", optional: true },
  { id: "lang", q: "آخر سؤال: الموقع بأنهي لغة؟" },
];

function Chip({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick}
      className="inline-flex min-h-11 items-center rounded-full border border-line bg-white px-4 py-2 text-sm font-semibold text-ink active:scale-95">{label}</button>
  );
}

interface Bubble { from: "bot" | "me"; text: string }
interface Answers { type: string; template: string; name: string; about: string; phone: string; address: string; lang: "ar" | "en" }

/** Chat-style onboarding: pick a ready-made template, answer a few questions, the AI fills the template for your business. */
export function AiOnboarding() {
  const router = useRouter();
  const [i, setI] = useState(0);
  const [a, setA] = useState<Answers>({ type: "", template: "", name: "", about: "", phone: "", address: "", lang: "ar" });
  const [bubbles, setBubbles] = useState<Bubble[]>([{ from: "bot", text: STEPS[0].q }]);
  const [text, setText] = useState("");
  const [building, setBuilding] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const end = useRef<HTMLDivElement>(null);

  useEffect(() => { end.current?.scrollIntoView({ behavior: "smooth", block: "end" }); }, [bubbles, building]);

  const step = i < STEPS.length ? STEPS[i] : null;

  function advance(patch: Partial<Answers>, shown: string) {
    const next = { ...a, ...patch };
    setA(next);
    const n = i + 1;
    const add: Bubble[] = [{ from: "me", text: shown }];
    if (n < STEPS.length) add.push({ from: "bot", text: STEPS[n].q });
    setBubbles((b) => [...b, ...add]);
    setText("");
    setI(n);
    if (n >= STEPS.length) void build(next);
  }

  async function build(d: Answers) {
    setError(null);
    setBuilding("بكتب محتوى موقعك جوه القالب…");
    const texts = await fillTemplate(
      { templateKey: d.template, name: d.name, about: d.about, phone: d.phone, address: d.address, lang: d.lang },
      (done, total) => setBuilding(`بكتب محتوى موقعك جوه القالب… ${done}/${total}`),
    );
    setBuilding("بجهّز موقعك…");
    const res = await createTemplateSite({ templateKey: d.template, name: d.name, texts, images: {}, dir: d.lang === "ar" ? "rtl" : "ltr" });
    if (!res.slug) {
      setError(res.error ?? "معرفتش أكمّل البناء. جرّب تاني.");
      setBuilding(null);
      setI(STEPS.length - 1);
      return;
    }
    setBuilding("جاهز! بفتحلك الموقع…");
    router.push(`/dashboard/sites/${res.slug}`);
  }

  const submitText = () => {
    const t = text.trim();
    if (!step || !t) return;
    if (step.id === "name") advance({ name: t.slice(0, 80) }, t);
    else if (step.id === "story") advance({ about: t.slice(0, 600) }, t);
    else if (step.id === "phone") advance({ phone: t.slice(0, 30) }, t);
    else if (step.id === "address") advance({ address: t.slice(0, 160) }, t);
  };
  const textStep = step && ["name", "story", "phone", "address"].includes(step.id);
  const recommended = TYPES.find((t) => t.id === a.type)?.tpl ?? [];
  const templates = [...TEMPLATE_CATALOG].sort((x, y) => Number(recommended.includes(y.key as never)) - Number(recommended.includes(x.key as never)));

  return (
    <div dir="rtl" className="fixed inset-0 z-40 flex flex-col bg-canvas text-ink">
      <header className="flex items-center gap-2 border-b border-line px-4 py-3">
        <Sparkles className="size-5 text-orange" aria-hidden />
        <h1 className="text-base font-bold">ابني موقعك مع WebSide</h1>
        <span dir="ltr" className="ms-auto text-xs text-muted">{Math.min(i + 1, STEPS.length)} / {STEPS.length}</span>
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
        <div className="max-h-[62dvh] overflow-y-auto border-t border-line bg-surface p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
          {step.id === "type" ? (
            <div className="flex flex-wrap gap-2">{TYPES.map((t) => <Chip key={t.id} label={t.label} onClick={() => advance({ type: t.id }, t.label)} />)}</div>
          ) : null}
          {step.id === "template" ? (
            <div className="grid grid-cols-2 gap-3">
              {templates.map((t) => (
                <button key={t.key} type="button" onClick={() => advance({ template: t.key }, `قالب ${t.nameAr}`)}
                  className="overflow-hidden rounded-xl border border-line bg-white text-start active:scale-[.98]">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={`/templates/premium/${t.key}/thumb.png`} alt="" loading="lazy" className="aspect-[16/10] w-full object-cover object-top" />
                  <span className="flex items-center justify-between px-3 py-2 text-sm font-semibold">
                    {t.nameAr}
                    {recommended.includes(t.key as never) ? <span className="rounded-full bg-orange/15 px-2 text-[11px] text-orange">مناسب ليك</span> : null}
                  </span>
                </button>
              ))}
            </div>
          ) : null}
          {step.id === "lang" ? (
            <div className="flex flex-wrap gap-2">
              <Chip label="عربي" onClick={() => advance({ lang: "ar" }, "عربي")} />
              <Chip label="English" onClick={() => advance({ lang: "en" }, "English")} />
            </div>
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
