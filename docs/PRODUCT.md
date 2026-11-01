# WebSide — Product direction

## Identity
Palette and fonts are specified in `DESIGN_SYSTEM.md`: reddish copper, orange, oxide blue;
IBM Plex Sans Arabic + IBM Plex Sans + Fraunces. The previous violet/aurora look is retired.

## The most important feature: the Menu Builder
A complete menu product for cafés and restaurants (the core Egyptian small-business use case):
- **CMS**: categories, items, prices, photos, badges, availability, sort order, Arabic/English names.
- **Multiple menu views**: list, grid with photos, compact price-list, category tabs, QR-first mobile view.
- **Database**: Supabase is the default store; Firebase is a supported alternative target.
- **Integrations**: Supabase and Firebase for the catalog; export to JSON/CSV.

## Dynamic sites (backend on request)
A customer who needs a dynamic site (backend, database) requests it from the platform. The
platform provisions a **private database and backend for that customer** (isolated per tenant) with
run options (managed by us, or on the customer's own Supabase/Firebase project). This is priced on
top of the site price.

## Plans (EGP)
| Plan | Setup | Monthly | Notes |
| --- | --- | --- | --- |
| Menu & Catalog | 799 | 50 | static menu/catalog on `web-side.pages.dev/<slug>` |
| Business Website | 1,499 | 50 | up to 5 pages, own `companyname.pages.dev`, motion graphics added manually via SUDO |
| Dynamic Catalog | from 1,499 | 50 | private DB + backend, price depends on options |
| Custom domain | 250 | — | extra |
| Migration | 600 | — | extra |

Rules: per-plan limits in `src/lib/limits.ts`; data isolated per customer; when a subscription
ends the site can be exported or unpublished; admin checks are enforced in the backend
(`is_sudo` / RLS); no secrets in the public repo.

Status: identity (this PR) → menu engine → provisioning/billing.
