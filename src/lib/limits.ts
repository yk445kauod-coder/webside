// Content limits shared by the editor (maxLength on inputs) and the server
// (zod validation). Keeping one copy means the UI can never let a customer type
// something the server will then refuse to save.

/** Packages. Enforced in Postgres (supabase/migrations/00005); a unit test keeps the numbers in sync. */
export type SitePlan = "menu" | "business" | "dynamic";
export const SITE_PLANS: SitePlan[] = ["menu", "business", "dynamic"];

export const PLAN_LIMITS: Record<
  SitePlan,
  { label: string; pages: number; blocksPerPage: number; menuItemsPerPage: number }
> = {
  menu: { label: "Menu & Catalog", pages: 3, blocksPerPage: 80, menuItemsPerPage: 800 },
  business: { label: "Business Website", pages: 5, blocksPerPage: 120, menuItemsPerPage: 300 },
  dynamic: { label: "Dynamic Catalog", pages: 5, blocksPerPage: 120, menuItemsPerPage: 800 },
};

/** Prices in EGP. Mirrors plan_monthly_price_egp() and the edit fee in supabase/migrations/00008. */
export const PLAN_PRICING_EGP: Record<SitePlan, { monthly: number; from?: boolean }> = {
  menu: { monthly: 799 },
  business: { monthly: 1499 },
  dynamic: { monthly: 1499, from: true },
};
export const EDIT_FEE_EGP = 50;
export const ADDON_PRICES_EGP = { domain: 250, migration: 600 } as const;

export const isSitePlan = (v: unknown): v is SitePlan =>
  typeof v === "string" && (SITE_PLANS as string[]).includes(v);

export const LIMITS = {
  heroTitle: 200,
  heroSubtitle: 500,
  heading: 200,
  paragraph: 5000,
  url: 2048,
  alt: 300,
  caption: 300,
  buttonLabel: 80,
  quote: 600,
  cite: 120,
  columnHeading: 120,
  columnText: 800,
  footer: 300,
  ctaTitle: 160,
  ctaText: 400,
  faqQ: 160,
  faqA: 800,
  faqItems: 8,
  statValue: 16,
  statLabel: 60,
  statItems: 4,
  galleryItems: 6,
  menuTitle: 120,
  menuCurrency: 8,
  menuCategories: 40,
  menuCategoryName: 60,
  menuItemsPerCategory: 120,
  menuItemName: 100,
  menuItemDescription: 300,
  menuItemPrice: 24,
  menuItemBadge: 24,
  contactTitle: 120,
  contactPhone: 30,
  contactAddress: 240,
  contactHours: 7,
  contactDay: 40,
  contactTime: 60,
  qrUrl: 200,
  pageTitle: 60,
  note: 1000,
  blocksPerPage: 200,
  pagesPerSite: 20,
} as const;
