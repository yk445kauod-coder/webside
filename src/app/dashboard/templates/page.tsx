import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = { title: "القوالب" };


const PREMIUM: Array<[string, string]> = [
  ["restaurant", "مطعم"], ["cafe", "كافيه"], ["bakery", "حلويات"], ["salon", "صالون"], ["clinic", "عيادة"],
  ["gym", "جيم"], ["shop", "متجر أزياء"], ["portfolio", "بورتفوليو"], ["agency", "وكالة إبداعية"], ["jewellery", "مجوهرات"],
];

function PremiumGallery() {
  return (
    <section className="mt-8">
      <ul className=" grid grid-cols-2 gap-4 lg:grid-cols-5">
        {PREMIUM.map(([key, label]) => (
          <li key={key} className="overflow-hidden rounded-2xl border border-line bg-white shadow-sm">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={`/templates/premium/${key}/thumb.png`} alt={label} loading="lazy" className="aspect-[4/3] w-full object-cover object-top" />
            <div className="flex items-center justify-between gap-2 p-3">
              <span className="font-semibold">{label}</span>
              <span className="flex items-center gap-3">
                <a href={`/templates/premium/${key}/index.html`} target="_blank" rel="noreferrer" className="text-sm font-medium text-muted underline">معاينة</a>
                <Link href={`/dashboard/templates/${key}`} className="rounded-lg bg-[#FD6B47] px-3 py-1.5 text-sm font-semibold text-white">استخدم</Link>
              </span>
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
        كل قالب جاهز بتصميمه وألوانه وحركته. احكيلنا عن شغلك والذكاء الاصطناعي بيكتب المحتوى، وبعدها تعدّل أي حاجة بإيدك.
      </p>
      <PremiumGallery />
    </div>
  );
}
