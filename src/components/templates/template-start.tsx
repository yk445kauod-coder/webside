"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { createTemplateSite } from "@/app/dashboard/actions";
import { TEMPLATE_CATALOG, renderTemplate } from "@/lib/template-site";
import { fillTemplate } from "@/lib/template-fill";

type Step = "brief" | "working" | "preview";

const inputCls = "h-11 w-full rounded-xl border border-line bg-white px-3 text-[15px]";

/**
 * Pick a template (done on the gallery), answer a few questions, let the AI write the template's text for your
 * business, look at the result, then continue in the editor to change anything by hand.
 */
export function TemplateStart({ templateKey }: { templateKey: string }) {
  const router = useRouter();
  const meta = TEMPLATE_CATALOG.find((t) => t.key === templateKey);
  const [step, setStep] = useState<Step>("brief");
  const [name, setName] = useState("");
  const [about, setAbout] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [lang, setLang] = useState<"ar" | "en">("ar");
  const [slug, setSlug] = useState("");
  const [texts, setTexts] = useState<Record<string, string>>({});
  const [progress, setProgress] = useState(0);
  const [note, setNote] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const dir = lang === "ar" ? "rtl" : "ltr";
  const doc = useMemo(
    () => (step === "preview" ? renderTemplate(templateKey, { texts, dir, siteName: name }) : ""),
    [step, templateKey, texts, dir, name],
  );

  async function generate() {
    setErr(null);
    setNote(null);
    setStep("working");
    setProgress(0);
    const out = await fillTemplate({ templateKey, name, about, phone, address, lang }, (d) => setProgress(d));
    if (Object.keys(out).length < 3) {
      setNote("الذكاء الاصطناعي مش متاح دلوقتي. كمّل وعدّل النصوص بنفسك من المحرر.");
    }
    setTexts(out);
    setStep("preview");
  }

  async function create() {
    setSaving(true);
    setErr(null);
    const res = await createTemplateSite({ templateKey, name, slug: slug || undefined, texts, images: {}, dir });
    if (res.slug) {
      router.push(`/dashboard/sites/${res.slug}`);
      return;
    }
    setSaving(false);
    setErr(res.error ?? "حصلت مشكلة. جرّب تاني.");
  }

  if (!meta) return null;

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-8 sm:px-6" dir="rtl">
      <p className="text-sm text-muted">قالب {meta.nameAr}</p>

      {step === "brief" ? (
        <form
          className="mt-2 flex max-w-xl flex-col gap-4"
          onSubmit={(e) => {
            e.preventDefault();
            void generate();
          }}
        >
          <h1 className="text-2xl font-bold sm:text-3xl">احكيلنا عن شغلك</h1>
          <p className="text-[15px] opacity-75">هنكتب نصوص القالب كلها على قد نشاطك، والتصميم والألوان والخطوط والحركة تفضل زي ما هي.</p>
          <label className="flex flex-col gap-1.5 text-sm font-medium">
            اسم النشاط
            <input className={inputCls} value={name} onChange={(e) => setName(e.target.value)} required maxLength={80} />
          </label>
          <label className="flex flex-col gap-1.5 text-sm font-medium">
            بتعمل إيه؟ (الخدمات، المنتجات، الأسعار، أي حاجة مميزة)
            <textarea
              className="min-h-28 w-full rounded-xl border border-line bg-white px-3 py-2 text-[15px]"
              value={about}
              onChange={(e) => setAbout(e.target.value)}
              maxLength={800}
            />
          </label>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="flex flex-col gap-1.5 text-sm font-medium">
              رقم التليفون
              <input dir="ltr" className={inputCls} value={phone} onChange={(e) => setPhone(e.target.value)} maxLength={30} />
            </label>
            <label className="flex flex-col gap-1.5 text-sm font-medium">
              العنوان
              <input className={inputCls} value={address} onChange={(e) => setAddress(e.target.value)} maxLength={160} />
            </label>
          </div>
          <div role="radiogroup" aria-label="لغة الموقع" className="flex gap-2">
            {(["ar", "en"] as const).map((l) => (
              <button
                key={l}
                type="button"
                role="radio"
                aria-checked={lang === l}
                onClick={() => setLang(l)}
                className={"rounded-full border px-4 py-2 text-sm font-medium " + (lang === l ? "border-ink bg-ink text-white" : "border-line bg-white")}
              >
                {l === "ar" ? "عربي" : "English"}
              </button>
            ))}
          </div>
          <Button type="submit" disabled={!name.trim()}>
            اكتب الموقع بالذكاء الاصطناعي
          </Button>
        </form>
      ) : null}

      {step === "working" ? (
        <div className="mt-16 flex flex-col items-center gap-3 text-center" role="status" aria-live="polite">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-line border-t-[#FD6B47]" aria-hidden="true" />
          <p className="text-lg font-semibold">بنكتب موقعك…</p>
          <p className="text-sm text-muted">دقيقة واحدة تقريباً. الدفعة {progress}</p>
        </div>
      ) : null}

      {step === "preview" ? (
        <div className="mt-2 flex flex-col gap-4">
          <h1 className="text-2xl font-bold sm:text-3xl">ده موقعك. عاينه.</h1>
          {note ? <p className="rounded-lg bg-warning-soft px-3 py-2 text-sm text-warning">{note}</p> : null}
          <iframe title="Preview" srcDoc={doc} sandbox="allow-scripts" className="h-[68vh] w-full rounded-xl border border-line bg-white" />
          <label className="flex max-w-sm flex-col gap-1.5 text-sm font-medium">
            عنوان الموقع (اختياري)
            <input dir="ltr" className={inputCls} value={slug} onChange={(e) => setSlug(e.target.value)} placeholder="my-business" maxLength={80} />
          </label>
          {err ? <p role="alert" className="text-sm text-danger">{err}</p> : null}
          <div className="flex flex-wrap gap-2">
            <Button onClick={() => void create()} loading={saving}>
              كمّل في المحرر وعدّل بنفسك
            </Button>
            <Button variant="outline" onClick={() => setStep("brief")} disabled={saving}>
              عدّل الإجابات
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
