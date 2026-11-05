// Registry of the Dynamic Catalog starters. The source lives in /templates/dynamic-app
// (a standalone Vite app, one Firebase project per customer); each business type is a
// preset selected at build time with VITE_VERTICAL. Keep ids in sync with templates/manifest.json.
export const DYNAMIC_VERTICALS = [
  { id: "cafe", label: "Cafe" },
  { id: "restaurant", label: "Restaurant" },
  { id: "bakery", label: "Bakery & sweets" },
  { id: "salon", label: "Salon & barber" },
  { id: "clinic", label: "Clinic" },
  { id: "gym", label: "Gym & fitness" },
  { id: "shop", label: "Shop catalog" },
] as const;
export type DynamicVerticalId = (typeof DYNAMIC_VERTICALS)[number]["id"];
