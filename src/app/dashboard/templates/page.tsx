import type { Metadata } from "next";
import { STATIC_TEMPLATES } from "@/puck/templates";
import { TemplateThumb } from "@/components/templates/template-thumb";
import { TemplateUse } from "@/components/templates/template-card";

export const metadata: Metadata = { title: "القوالب" };

export default function TemplatesPage() {
  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6" dir="rtl">
      <h1 className="text-2xl font-bold sm:text-3xl">اختار قالب وابدأ</h1>
      <p className="mt-2 max-w-xl text-[15px] opacity-75">
        كل قالب جاهز بالمحتوى والصور. غيّر الكلام والصور من المحرر وانشر موقعك في دقائق.
      </p>
      <ul className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {STATIC_TEMPLATES.map((t) => (
          <li key={t.key} className="overflow-hidden rounded-2xl border border-line bg-white shadow-sm">
            <TemplateThumb template={t} />
            <div className="border-t border-line px-4 pt-3">
              <h2 className="font-semibold">{t.nameAr}</h2>
              <p className="text-sm opacity-70">{t.blurb}</p>
            </div>
            <TemplateUse templateKey={t.key} label={t.nameAr} />
          </li>
        ))}
      </ul>
    </div>
  );
}
