# University ERP — Frontend

React SPA for a multi-campus university SaaS ERP: nine signed-in role portals (admin, director, campus
manager, teacher, student, parent, mentor, staff, partner) plus a public client area, in ten languages
with RTL support.

This repository is one of **four separate bricks** — see [`CLAUDE.md`](CLAUDE.md) §0. The API and every
enum, status code and module registry live in the backend; this repo consumes them.

## Stack

React 19 · React Router v7 · MUI v7 · Formik + Yup · Axios · i18next (ICU) · Vite 7 · Tailwind v4 *(public area only)* · recharts · framer-motion

## Getting started

```bash
nvm use              # Node 20 (.nvmrc)
npm ci
cp .env.example .env # then point VITE_API_BASE_URL at a running backend
npm run dev          # http://localhost:5173
```

The backend must be running (default `http://localhost:5000/api`) for anything past the public pages.

## Scripts

| Command | What it does |
|---|---|
| `npm run dev` | Vite dev server with HMR |
| `npm run build` | Production build — **the verification step for any change** |
| `npm run lint` | ESLint over the whole tree (see *Known debt*) |
| `npm run preview` | Serve the production build locally |
| `node scripts/check-missing-keys.js` | Cross-check every locale against `en/`; exits 1 on a missing key |

There is **no test suite and no test runner** in this repository. `npm run build` is what CI verifies.

## Environment

| Variable | Purpose |
|---|---|
| `VITE_API_BASE_URL` | Backend API base, e.g. `http://localhost:5000/api` |
| `VITE_IMAGE_BASE_URL` | Backend origin serving uploaded media |
| `VITE_PORTAL_URL` | Public Next.js pre-registration portal (`/register` redirects there) |

Always read them through [`src/config/env.js`](src/config/env.js), never `import.meta.env` directly.

## Layout

```
src/
├── api/          axios singleton + entitlement refusal channel
├── components/   shared/ · entitlement/ · form/ · ai/ · announcements/ · … + AppShell
├── config/       env + entitlement constants (mirrors of backend vocabularies)
├── context/      AuthContext · EntitlementContext
├── hooks/        useFeature · useHardDelete · useEntityManager · domain hooks
├── routes/       ProtectedRoute → CampusGuard → FeatureGuard, one file per portal
├── services/     one *Service.js per domain — no component holds a raw URL
├── i18n/         i18next setup (10 languages; namespaces defined in the registry)
├── utils/        dateFormat · handleSubmitError · validationRules
└── <role>/       admin · director · campus · teacher · student · parent · mentor · staff · partner · client
public/locales/   <lng>/<ns>.json — `en/` is the reference locale
```

## Architecture rules

Three of them are load-bearing and easy to get backwards:

1. **Campus isolation fails *closed*.** Never hardcode `campusId`; `CampusGuard` enforces it.
2. **Entitlement fails *open*.** Module gating is commercial packaging, not security — an unknown key means
   enabled, and the server is what enforces the rule. Always ask through `useFeature`.
3. **Hard delete reads its permissions from the server catalogue**, never from a hard-coded role.

The full set — routing layers, the `GenericEntityPage` pattern, the MUI v7 traps (Select / Grid / Dialog),
i18n conventions — is in [`CLAUDE.md`](CLAUDE.md). Read it before adding a module.

## CI & deployment

GitHub Actions ([`.github/workflows/frontend.yml`](.github/workflows/frontend.yml)) on push/PR to `main`:
`npm ci` → `npm run build` → `npm audit --audit-level=high` (blocking). Deployed on Vercel with an SPA
rewrite to `index.html`.

### Known debt

Existing lint debt is recorded in the engineering guide; historical totals are not a current
baseline. CI does not run lint. Lint touched files (`npx eslint <file>`) and compare any
failures with the existing code before attributing them to the change.

## Product home and deployment identity

The public home sells the academic software; applicant recruitment remains in the
Next.js portal configured by `VITE_PORTAL_URL`. The local preview uses synthetic
illustrative data and performs no business API requests.

`src/config/brand.js` owns public product configuration. Set `VITE_BRAND_NAME`
(default Wewigo), optional `VITE_BRAND_LOGO_URL` and `VITE_BRAND_ICON_URL` before
building. HTTPS asset URLs or root-relative asset paths are accepted. Rebuild after
changing these values; branding is deployment-wide, not editable per campus.
`VITE_SALES_URL` (HTTPS) takes priority over `VITE_SALES_EMAIL`; without either,
actions lead to the product preview. Optional `VITE_PRIVACY_URL` and `VITE_TERMS_URL`
are shown only when configured with valid destinations. No default sales address.
Keep backend `PRODUCT_BRAND_NAME` and portal `NEXT_PUBLIC_PRODUCT_BRAND_NAME` aligned.
Existing campus names/logos and the portal's establishment override remain independent.
The public language selector stores the preference locally without an anonymous
settings PATCH. Product texts are in the lazy `home` namespace in all ten locales.
