// Content limits shared by the editor (maxLength on inputs) and the server
// (zod validation). Keeping one copy means the UI can never let a customer type
// something the server will then refuse to save.

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
  pageTitle: 60,
  note: 1000,
  blocksPerPage: 200,
  pagesPerSite: 20,
} as const;
