import type { Metadata } from "next";
import { STATIC_TEMPLATES } from "@/puck/templates";
import { TemplateThumb } from "@/components/templates/template-thumb";
import { TemplateUse } from "@/components/templates/template-card";

export const metadata: Metadata = { title: "القوالب" };


const PREMIUM: Array<[string, string]> = [
  ["restaurant", "مطعم"], ["cafe", "كافيه"], ["bakery", "حلويات"], ["salon", "صالون"], ["clinic", "عيادة"],
  ["gym", "جيم"], ["shop", "متجر أزياء"], ["portfolio", "بورتفوليو"], ["agency", "وكالة إبداعية"], ["jewellery", "مجوهرات"],
];

function PremiumGallery() {
  return (
    <section className="mt-12">
      <h2 className="text-xl font-bold sm:text-2xl">قوالب مميزة جاهزة</h2>
      <p className="mt-2 max-w-xl text-[15px] opacity-75">تصميمات احترافية كاملة. عاين القالب وكلّمنا نجهزه لك باسمك وصورك.</p>
      <ul className="mt-6 grid grid-cols-2 gap-4 lg:grid-cols-5">
        {PREMIUM.map(([key, label]) => (
          <li key={key} className="overflow-hidden rounded-2xl border border-line bg-white shadow-sm">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={`/templates/premium/${key}/thumb.png`} alt={label} loading="lazy" className="aspect-[4/3] w-full object-cover object-top" />
            <div className="flex items-center justify-between gap-2 p-3">
              <span className="font-semibold">{label}</span>
              <a href={`/templates/premium/${key}/index.html`} target="_blank" rel="noreferrer" className="text-sm font-medium text-[#FD6B47] underline">معاينة</a>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}

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
      <PremiumGallery />
    </div>
  );
}
