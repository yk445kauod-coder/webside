import type { PageItem } from "./sanitize";

export interface TemplateInfo {
  key: string;
  name: string;
  nameAr: string;
  blurb: string;
  category: "food" | "beauty" | "health" | "retail" | "creative";
  thumb: string;
  pages: Array<{ key: string; title: string; path: string; items: PageItem[] }>;
}

type Menu = { name: string; items: Array<[string, string, string, string?]> }[];
interface Spec {
  key: string; name: string; nameAr: string; blurb: string; category: TemplateInfo["category"];
  brand: string; eyebrow: string; title: string; text: string; cta: string;
  features: Array<[string, string, string]>; // title, text, icon
  menuTitle: string; menu: Menu; stats: Array<[string, string]>;
  faq: Array<[string, string]>; phone: string; address: string; hours: Array<[string, string]>;
  about: string; aboutTitle: string;
}

let n = 0;
const id = (k: string) => `${k}-${++n}`;
// Free-licence Unsplash photos (every id verified to resolve). Hotlinked, so nothing is stored in the repo.
const PHOTOS: Record<string, [string, string]> = {"restaurant": ["1544025162-d76694265947", "1651440204227-a9a5b9d19712"], "cafe": ["1542372147193-a7aca54189cd", "1509042239860-f550ce710b93"], "bakery": ["1583338917451-face2751d8d5", "1568254183919-78a4f43a2877"], "salon": ["1634449571010-02389ed0f9b0", "1580618672591-eb180b1a973f"], "clinic": ["1576091160550-2173dba999ef", "1519494026892-80bbd2d6fd0d"], "gym": ["1534438327276-14e5300c3a48", "1571902943202-507ec2618e8f"], "shop": ["1441986300917-64674bd600d8", "1441984904996-e0b6ba687e04"], "portfolio": ["1502810190503-8303352d0dd1", "1487338875411-8880f74114a2"]};
const img = (k: string, f: string) =>
  `https://images.unsplash.com/photo-${PHOTOS[k][f === "hero" ? 0 : 1]}?auto=format&fit=crop&w=${f === "hero" ? 1400 : 1200}&q=75`;

function build(s: Spec): TemplateInfo {
  const k = s.key;
  const preset: Record<string, string> = { restaurant: "ember", cafe: "roast", bakery: "rose", salon: "plum", clinic: "teal", gym: "volt", shop: "ink", portfolio: "studio" };
  const layout = ["restaurant", "gym", "salon", "portfolio"].includes(k) ? "cinematic" : "split";
  const items: PageItem[] = [
    { type: "Theme", props: { id: id("t"), preset: preset[k] } },
    { type: "Hero", props: { id: id("h"), layout, background: "default", backdrop: "none", padding: "128px", eyebrow: s.eyebrow, title: s.title, description: `<p>${s.text}</p>`, buttons: [{ label: s.cta, href: "#contact", variant: "primary" }, { label: s.menuTitle, href: "#menu", variant: "secondary" }], image: { mode: "image", source: { src: img(k, "hero"), alt: s.brand } } } },
    { type: "Stats", props: { id: id("s"), layout: "glass", background: "subtle", backdrop: "none", padding: "64px", title: "", items: s.stats.map(([value, label]) => ({ value, label })) } },
    { type: "FeatureGrid", props: { id: id("f"), background: "subtle", backdrop: "none", padding: "96px", columns: 3, cardMode: "card", title: s.aboutTitle, description: s.about, cards: s.features.map(([title, description, icon]) => ({ type: "Card", props: { id: id("c"), title, description, icon, mode: "card" } })) } },
    { type: "Menu", props: { id: id("m"), title: s.menuTitle, currency: "ج.م", view: "tabs", categories: s.menu.map((c) => ({ name: c.name, items: c.items.map(([name, description, price, badge]) => ({ name, description, price, image: "", badge: badge ?? "", available: true })) })) } },
    { type: "Image", props: { id: id("i"), src: img(k, "a"), alt: s.brand, caption: "" } },
    { type: "FAQ", props: { id: id("q"), background: "default", backdrop: "none", padding: "96px", title: "أسئلة شائعة", description: "", items: s.faq.map(([question, answer]) => ({ question, answer })) } },
    { type: "Contact", props: { id: id("ct"), title: "تواصل معنا", phone: s.phone, whatsapp: s.phone, address: s.address, mapUrl: "", qrUrl: "", hours: s.hours.map(([day, time]) => ({ day, time })) } },
    { type: "CTA", props: { id: id("cta"), layout: "centered", background: "inverse", backdrop: "none", padding: "96px", title: s.title, description: s.blurb, buttons: [{ label: s.cta, href: "#contact", variant: "primary" }] } },
  ];
  return { key: k, name: s.name, nameAr: s.nameAr, blurb: s.blurb, category: s.category, thumb: `/templates/thumbs/${k}.webp`, pages: [{ key: "home", title: "الرئيسية", path: "/", items }] };
}

const wk: [string, string][] = [["السبت – الخميس", "10:00 ص – 11:00 م"], ["الجمعة", "2:00 م – 11:00 م"]];
const ph = "+201000000000";

export const STATIC_TEMPLATES: TemplateInfo[] = [
  build({ key: "restaurant", name: "Restaurant", nameAr: "مطعم", blurb: "قائمة طعام كاملة وحجز بالواتساب.", category: "food", brand: "مطعم", eyebrow: "مطعم عائلي", title: "أكل بيتي بطعم الأصل", text: "أطباق مصرية ومشويات طازجة تتحضر على أصولها كل يوم.", cta: "اطلب الآن", aboutTitle: "ليه تختارنا", about: "جودة ثابتة وأسعار مفهومة.", menuTitle: "المنيو",
    features: [["خامات طازجة", "بنشتري يوميًا من أحسن الموردين.", "leaf"], ["توصيل سريع", "لحد باب البيت خلال دقائق.", "truck"], ["جلسات عائلية", "مساحة مريحة للكل.", "users"]],
    menu: [{ name: "المشويات", items: [["كباب مشكل", "كباب وكفتة وريش مع أرز وسلطة.", "320", "الأكثر طلبًا"], ["فراخ مشوية", "نص فرخة بتتبيلة البيت.", "180"], ["كفتة", "كفتة مشوية على الفحم.", "150"]] }, { name: "الأطباق الرئيسية", items: [["ملوخية بالفراخ", "طبق ملوخية مع أرز.", "120"], ["محشي مشكل", "كرنب وورق عنب وفلفل.", "110"], ["مسقعة", "باذنجان مقلي بصلصة.", "80"]] }, { name: "المشروبات", items: [["عصير ليمون", "ليمون طازج بالنعناع.", "35"], ["شاي", "كوب شاي بالنعناع.", "15"]] }],
    stats: [["+15", "سنة خبرة"], ["+50", "صنف"], ["4.8", "تقييم العملاء"]], faq: [["هل في توصيل؟", "أيوه، داخل المنطقة وبرسوم بسيطة."], ["ممكن أحجز طاولة؟", "كلمنا على الواتساب وهنأكد حجزك."]], phone: ph, address: "العنوان — المدينة", hours: wk }),
  build({ key: "cafe", name: "Café", nameAr: "كافيه", blurb: "قهوة مختصة وحلويات في مكان هادي.", category: "food", brand: "كافيه", eyebrow: "قهوة مختصة", title: "فنجان يستاهل وقتك", text: "بن محمّص طازج ومشروبات باردة وساخنة في مكان هادي للقعدة والشغل.", cta: "تعالى زورنا", aboutTitle: "عن المكان", about: "مكان مريح للقعدة والشغل.", menuTitle: "المشروبات والحلويات",
    features: [["بن طازج", "بنحمّص بن مختص كل أسبوع.", "coffee"], ["إنترنت سريع", "واي فاي ومقاعد مريحة.", "wifi"], ["حلويات يومية", "من مخبزنا كل صباح.", "cake"]],
    menu: [{ name: "قهوة ساخنة", items: [["إسبريسو", "شوت مركّز.", "45"], ["كابتشينو", "حليب مبخر وفوم كريمي.", "65", "الأفضل"], ["فلات وايت", "ثنائي الشوت.", "70"]] }, { name: "مشروبات باردة", items: [["آيس لاتيه", "إسبريسو وحليب مثلج.", "75"], ["كولد برو", "مخمّر 18 ساعة.", "80"]] }, { name: "حلويات", items: [["كرواسون", "زبدة فرنسي.", "55"], ["تشيز كيك", "بصوص التوت.", "90"]] }],
    stats: [["+30", "نوع قهوة"], ["8 ص", "نفتح بدري"], ["4.9", "تقييم"]], faq: [["في أماكن للشغل؟", "أيوه، واي فاي ومقاعد مريحة."], ["بتبيعوا البن؟", "أيوه، بن محمّص طازج بالكيلو."]], phone: ph, address: "العنوان — المدينة", hours: [["يوميًا", "8:00 ص – 12:00 ص"]] }),
  build({ key: "bakery", name: "Bakery & Sweets", nameAr: "حلويات ومخبز", blurb: "تورتات وحلويات وطلبات المناسبات.", category: "food", brand: "حلويات", eyebrow: "مخبز وحلويات", title: "حلاوة كل مناسبة", text: "تورتات وكيك وحلويات شرقية بتتعمل لك على الطلب وبخامات فاخرة.", cta: "اطلب تورتة", aboutTitle: "ليه حلوياتنا", about: "صنع يدوي كل يوم.", menuTitle: "كتالوج الحلويات",
    features: [["صنع يدوي", "كل قطعة بتتحضّر بإيد خبرة.", "heart"], ["طلبات خاصة", "نصمم تورتتك على ذوقك.", "gift"], ["توصيل مبرد", "يوصل سليم وطازج.", "truck"]],
    menu: [{ name: "تورتات", items: [["تورتة شوكولاتة", "كيلو شوكولاتة بلجيكية.", "450", "الأكثر طلبًا"], ["تورتة فراولة", "كريمة وفراولة طازجة.", "420"]] }, { name: "شرقي", items: [["بسبوسة", "بالقشطة.", "180"], ["كنافة", "بالمكسرات.", "220"]] }, { name: "ميني", items: [["كب كيك (6)", "نكهات متنوعة.", "150"], ["ماكرون (6)", "ألوان ونكهات.", "200"]] }],
    stats: [["+500", "تورتة شهريًا"], ["24 س", "تحضير للطلبات"], ["4.9", "تقييم"]], faq: [["لازم أحجز قبلها؟", "التورتات المخصوصة قبلها بـ 48 ساعة."], ["بتوصلوا؟", "أيوه، توصيل مبرد داخل المدينة."]], phone: ph, address: "العنوان — المدينة", hours: wk }),
  build({ key: "salon", name: "Salon & Barber", nameAr: "صالون", blurb: "قائمة خدمات وأسعار وحجز.", category: "beauty", brand: "صالون", eyebrow: "عناية وجمال", title: "إطلالة تعبّر عنك", text: "قص وصبغة وعناية بالبشرة على إيد محترفين وبأحدث المنتجات.", cta: "احجز موعدك", aboutTitle: "خدماتنا", about: "نهتم بأدق التفاصيل.", menuTitle: "قائمة الأسعار",
    features: [["خبراء متخصصون", "فريق بخبرة سنين.", "badge-check"], ["منتجات أصلية", "ماركات عالمية معتمدة.", "shield-check"], ["حجز سهل", "عن طريق واتساب.", "clock"]],
    menu: [{ name: "الشعر", items: [["قص شعر", "قص وتصفيف.", "150"], ["صبغة", "حسب الطول.", "600"], ["بروتين", "علاج وفرد.", "1200"]] }, { name: "العناية", items: [["تنظيف بشرة", "جلسة كاملة.", "350"], ["مانيكير", "عناية بالأظافر.", "120"]] }],
    stats: [["+10", "سنين خبرة"], ["+2000", "عميل سعيد"], ["4.9", "تقييم"]], faq: [["لازم حجز؟", "يفضل الحجز مسبقًا."], ["بتقبلوا دفع إلكتروني؟", "أيوه، إنستاباي وكاش."]], phone: ph, address: "العنوان — المدينة", hours: wk }),
  build({ key: "clinic", name: "Clinic", nameAr: "عيادة", blurb: "تعريف بالطبيب والخدمات والمواعيد.", category: "health", brand: "عيادة", eyebrow: "رعاية طبية", title: "صحتك تستاهل اهتمام", text: "كشف واستشارات وخطط علاج على إيد أطباء متخصصين في بيئة مريحة.", cta: "احجز كشف", aboutTitle: "خدماتنا", about: "رعاية متكاملة لكل العائلة.", menuTitle: "الخدمات والأسعار",
    features: [["أطباء متخصصون", "خبرة وتخصص عالي.", "stethoscope"], ["مواعيد منظمة", "من غير انتظار طويل.", "clock"], ["خصوصية تامة", "ملفك محفوظ وآمن.", "lock"]],
    menu: [{ name: "الكشف", items: [["كشف جديد", "مدة 30 دقيقة.", "400"], ["استشارة", "متابعة.", "250"]] }, { name: "التحاليل", items: [["صورة دم", "تحليل شامل.", "150"], ["سكر تراكمي", "تحليل.", "200"]] }],
    stats: [["+12", "سنة خبرة"], ["+8000", "مريض"], ["4.9", "تقييم"]], faq: [["أحجز إزاي؟", "عن طريق الواتساب أو التليفون."], ["في تأمين؟", "بنتعامل مع شركات تأمين محددة."]], phone: ph, address: "العنوان — المدينة", hours: [["السبت – الخميس", "4:00 م – 10:00 م"], ["الجمعة", "إجازة"]] }),
  build({ key: "gym", name: "Gym & Fitness", nameAr: "جيم", blurb: "باقات الاشتراك والمدربين.", category: "health", brand: "جيم", eyebrow: "لياقة وتدريب", title: "ابدأ التغيير النهاردة", text: "أجهزة حديثة ومدربين معتمدين وبرامج تناسب هدفك من أول يوم.", cta: "اشترك الآن", aboutTitle: "ليه جيمنا", about: "كل اللي محتاجه علشان توصل لهدفك.", menuTitle: "باقات الاشتراك",
    features: [["أجهزة حديثة", "معدات بمعايير عالمية.", "dumbbell"], ["مدربين معتمدين", "برنامج مخصوص لك.", "badge-check"], ["حصص جماعية", "كارديو ويوجا.", "flame"]],
    menu: [{ name: "الاشتراكات", items: [["شهري", "دخول مفتوح.", "500"], ["3 شهور", "وفّر أكتر.", "1300", "الأوفر"], ["سنوي", "أفضل سعر.", "4500"]] }, { name: "تدريب خاص", items: [["حصة بيرسونال", "ساعة مع مدرب.", "250"], ["باقة 10 حصص", "برنامج متكامل.", "2000"]] }],
    stats: [["+300", "عضو نشط"], ["10", "مدربين"], ["24/7", "ساعات العمل"]], faq: [["في فترة تجريبية؟", "أيوه، يوم تجريبي مجاني."], ["في حصص للسيدات؟", "أيوه، مواعيد مخصصة."]], phone: ph, address: "العنوان — المدينة", hours: [["يوميًا", "6:00 ص – 12:00 ص"]] }),
  build({ key: "shop", name: "Shop catalog", nameAr: "متجر كتالوج", blurb: "عرض منتجاتك وأسعارك والطلب بالواتساب.", category: "retail", brand: "متجر", eyebrow: "تسوّق بسهولة", title: "منتجات مختارة بعناية", text: "تصفح الكتالوج واطلب مباشرة على الواتساب مع توصيل لحد بابك.", cta: "اطلب الآن", aboutTitle: "ليه تتسوق معنا", about: "جودة وأسعار واضحة.", menuTitle: "المنتجات",
    features: [["جودة مضمونة", "منتجات أصلية.", "badge-check"], ["شحن لكل المحافظات", "توصيل سريع.", "truck"], ["استبدال سهل", "خلال 14 يوم.", "shopping-bag"]],
    menu: [{ name: "الأكثر مبيعًا", items: [["منتج ١", "وصف مختصر للمنتج.", "250", "جديد"], ["منتج ٢", "وصف مختصر للمنتج.", "320"], ["منتج ٣", "وصف مختصر للمنتج.", "180"]] }, { name: "عروض", items: [["عرض ١", "خصم لفترة محدودة.", "199", "خصم"], ["عرض ٢", "خصم لفترة محدودة.", "149"]] }],
    stats: [["+1000", "طلب"], ["48 س", "شحن"], ["4.8", "تقييم"]], faq: [["الدفع إزاي؟", "كاش عند الاستلام أو إنستاباي."], ["الشحن بكام؟", "حسب المحافظة."]], phone: ph, address: "العنوان — المدينة", hours: wk }),
  build({ key: "portfolio", name: "Portfolio", nameAr: "بورتفوليو", blurb: "اعرض أعمالك وخدماتك واستقبل الطلبات.", category: "creative", brand: "أعمالي", eyebrow: "مصمم ومبدع", title: "أعمال بتتكلم عن نفسها", text: "نظرة على مشاريعي وخدماتي. لو عجبتك، كلمني نبدأ مشروعك.", cta: "ابدأ مشروعك", aboutTitle: "ما أقدمه", about: "حلول بصرية بتفرّق.", menuTitle: "الخدمات والأسعار",
    features: [["هوية بصرية", "شعار وألوان وخطوط.", "palette"], ["تصوير", "جلسات احترافية.", "camera"], ["مواقع", "تصميم وتنفيذ.", "globe"]],
    menu: [{ name: "الباقات", items: [["أساسية", "شعار + ألوان.", "1500"], ["متكاملة", "هوية كاملة.", "4000", "الأفضل"]] }],
    stats: [["+80", "مشروع"], ["+40", "عميل"], ["6", "سنين خبرة"]], faq: [["المدة؟", "من أسبوع لأسبوعين."], ["التعديلات؟", "جولتين مشمولة."]], phone: ph, address: "عن بعد", hours: [["السبت – الخميس", "10:00 ص – 6:00 م"]] }),
];

export function getStaticTemplate(key: string): TemplateInfo | undefined {
  return STATIC_TEMPLATES.find((t) => t.key === key);
}
