# CLAUDE.md — Frontend ERP (React 19 / MUI v7 / i18next / Formik / Yup / Axios)

> Multi-campus university SaaS ERP — React SPA, 9 signed-in role portals + a public client area, 10 languages, RTL.
> Stack: React 19 · React Router v7 · MUI v7 · Formik + Yup · Axios · i18next (ICU) · Vite 7 · Tailwind v4 *(public area only)*
> Entry: `main.jsx` (providers) → `App.jsx` (route mounting).

> **This file carries what cannot be derived from the tree**: inverted defaults, traps, and pointers.
> Inventories (hooks, components, routes, locales) are read from the source — `ls src/hooks`, `grep path= src/routes/*.jsx`,
> `src/i18n/i18n.js`. Every file here has a JSDoc `@file` header stating its own rule; read it when you touch it.

---

## 0. The four bricks — the backend is the source of truth

Four **separate git repos**, not a monorepo. Under `/home/adminsecu/Projects/`:
`university/backend` (the API) · `university/frontend` *(this repo)* · `university/ai-service` (RAG, reached **only** via `/api/ai`)
· ⚠️ `partner` — the public Next.js pre-registration portal, **not under `university/`**; `VITE_PORTAL_URL` points at it.

- **Never duplicate a backend literal** — enums, statuses, error codes, module keys are defined backend-side and *mirrored*
  here. Canonical example: `src/config/featureConstants.js`, which mirrors two frozen vocabularies and deliberately nothing else.
- **An API change is not done until the service *and* its hook follow** (`src/services/*` → `src/hooks/*`).
- Bricks are wired by **environment, not imports**: `VITE_API_BASE_URL`, `VITE_IMAGE_BASE_URL`, `VITE_PORTAL_URL`.
- `backend/CLAUDE.md` is the reference for the server half of any rule below; entitlement design doc:
  `backend/docs/architecture/CAMPUS_ENTITLEMENT_DESIGN.md`.

## 0.1 Language — MANDATORY

All comments, JSDoc, log messages and identifiers in **English**, in every new or edited file.
`@file` + `@description` at the top of every file, JSDoc on every exported function/component. Explain the rule, not the syntax.

## 0.2 DRY — MANDATORY

Look for the existing helper before writing logic: `src/hooks/` · `src/components/shared/` · `src/services/` · `src/utils/`.
A rule restated in a component is a second source of truth, and it fails in the direction nobody notices — a control
silently missing for someone entitled to it.

---

## 1. Campus isolation — SECURITY BOUNDARY, fails **closed**

- **Never hardcode `campusId`** — always from `useParams()` or `user.campusId`; always pass it as query param or path segment.
- `routes/CampusGuard.jsx` confines CAMPUS_MANAGER to their own campus URL.
- `ADMIN` / `DIRECTOR` carry no `campusId` in the token — they bypass the check; handle the absence without crashing.

---

## 2. Entitlement — commercial gating, fails **OPEN**

Per-campus module packaging. **The exact inverse of §1 — never reason about one by analogy with the other.**
An unknown key, a campus with no entitlement and a failed hydration all answer `enabled`. The server gate enforces;
everything here only decides what is worth drawing.

**States** (`config/featureConstants.js`): `enabled` · `read_only` · `hidden`.
`hidden` → the surface is **removed**, never greyed out (indiscernible from a module that never existed).
`read_only` → page and history **stay reachable**; only mutating affordances go.
`ADMIN` / `DIRECTOR` (`UNRESTRICTED_ROLES`) are bound by nothing — they keep the surface, with a "disabled for this campus" badge.

### Non-negotiable

1. **No hard-coded module list, never `user.plan`.** The backend registry is the truth and travels on
   `GET /api/settings/entitlement` — adding a module backend-side must never need a frontend release.
2. **Ask only through `useFeature(key)`** → `{ ready, state, visible, canWrite, readOnly, hidden, restricted, unrestricted, label }`.
   It already folds in the unrestricted-role rule, so no caller checks the role itself. `useEntitlement()` for the whole context.
3. **Never decide before `ready`.** A control that appears then vanishes is the one failure users report as a bug.

### Surfaces — each rule lives in exactly one of them

| Surface | Use |
|---|---|
| `routes/FeatureGuard.jsx` | Route gate. **Composed with `ProtectedRoute`, never substituted** — one asks about the role, the other about the campus. `read_only` **passes**, and the frozen banner is rendered above the page. |
| `shared/FeatureGate.jsx` | Section/button. `mode="read"` hides on `hidden`; `mode="write"` also hides on `read_only`. |
| `shared/FeatureFrozenNotice.jsx` | The single frozen-module banner. Per-button granularity is **out of v1**: announce once above the surface. |
| `components/AppShell.jsx` | Nav item declares `feature: '<key>'`; **filtering happens there and nowhere else.** |
| `hooks/useModuleLabel.js` | Registry key → translated module name. Never show a raw key. |
| `hooks/useEntitlementPilot.js` | Engine shared by both pilot screens. **No rule is decided frontend-side** — `allowedStates` and the justification minimum travel on the payload. |

- **Write-in-flight**: a 403 carrying `FEATURE_DISABLED` / `FEATURE_READ_ONLY` is *not* a role refusal. `api/axiosInstance.js`
  forwards it via `api/featureRefusal.js` so the provider re-hydrates and the UI catches up; the error is still rejected.
- `EntitlementProvider` sits in `main.jsx` inside `BrowserRouter` + `AuthProvider` + `RtlProvider` + the i18n Suspense
  boundary. Constrained on three sides — **do not move it** (the header says why).

---

## 3. Hard delete — the danger zone

- **Single entry point `useHardDelete(entityType, { onDeleted })`** → `{ enabled, requireArchivedFirst, canDelete, requestDelete, dialogProps }`.
- **Never hard-code the role.** `GenericEntityPage` used to hard-code `ADMIN`, which fit the five actor entities and nothing
  else. Allowed roles **and** `requireArchivedFirst` both travel on `GET /danger-zone/entities`.
- The catalogue is cached once per session, **keyed by identity** — never let one account read another's permissions.
- Surfaces: `shared/HardDeleteAction.jsx` · `shared/HardDeleteDialog.jsx` · `services/dangerZoneService.js`.
- Like §2: **a convenience gate, never a security control.** The server re-checks on the preview and again on the deletion.

---

## 4. Routing

Route files export **arrays/fragments** (`export const campusRoutes = (<>…</>)`), not `<XRoutes>` components; `App.jsx` mounts them.
Three composable layers, in order:

```
ProtectedRoute (auth + role)  →  CampusGuard (§1, campus only)  →  FeatureGuard (§2, per module)
```

Portals: `clientRoutes` (public, `src/client/`) · `/activate[/:token]` · `/admin` · `/director` · `/campus/:campusId`
· `/teacher` · `/student` · `/parent` · `/partner` · `/mentor` · `/staff`.

Campus sub-routes each carry their registry key inline — read `src/routes/CampusRoutes.jsx`, don't assume.
**Ungated by design**: `dashboard`, `schedule`, `attendance`, `notification-log`, `settings`. Everything else is wrapped.

New page → register in the matching `*Routes.jsx`, wrap in `FeatureGuard` if the module is in the registry, and add the nav
entry **with its `feature` key** in the layout's `navItems`.

---

## 5. GenericEntityPage — MANDATORY for CRUD modules

Never re-implement CRUD / filter / pagination / bulk. Four files:
`entityConfig.jsx` (static columns/filters/KPIs/bulk/endpoints) · `EntityForm.jsx` (Formik + Yup) ·
`EntityDetailDrawer.jsx` (read-only, min 400px, no forms inside) · `Entity.jsx` (thin orchestrator).
Mutating affordances inside are subject to §2 (`FeatureGate mode="write"`) and §3.

---

## 6. CRITICAL UI rules (never break these)

### Selects — ALWAYS FormControl + InputLabel + Select
**NEVER `<TextField select>`** — breaks `<label for> → <input id>` accessibility in MUI v7.

```jsx
<FormControl fullWidth error={Boolean(touched.status && errors.status)}>
  <InputLabel id="status-label">Status</InputLabel>
  <Select labelId="status-label" id="status" name="status"
          value={values.status} label="Status"
          onChange={handleChange} onBlur={handleBlur}>
    <MenuItem value="ACTIVE">Active</MenuItem>
  </Select>
  {touched.status && errors.status && <FormHelperText>{errors.status}</FormHelperText>}
</FormControl>
```

### MUI Grid — ALWAYS the `size` prop
```jsx
<Grid size={{ xs: 12, sm: 6, md: 4 }}>  // ✅
<Grid item xs={12} sm={6} md={4}>       // ❌ FORBIDDEN
```

### MUI Dialog — ALWAYS these two props (aria-hidden fix)
```jsx
<Dialog open={open} onClose={handleClose}
  disableEnforceFocus
  closeAfterTransition={false}
  slotProps={{ paper: { sx: { borderRadius: 3 } } }}   // PaperProps is deprecated in v7
>
```

---

## 7. API — Axios

- **Always** the singleton: `import api from '../api/axiosInstance'`. **Never** `fetch()` or a direct `axios` import
  (sole exception: `AuthContext.jsx` login).
- The interceptor owns three cross-cutting behaviours — never re-implement them per call: refresh-token replay,
  forced logout on refresh failure, entitlement refusal (§2).
- One `*Service.js` per domain in `src/services/`, named exports; **no component holds a raw URL.**
  (`admin_service.js` keeps the legacy snake_case name; new files are camelCase.)
- Form errors → `handleSubmitError` from `utils/handleSubmitError`.

---

## 8. Auth

```js
const { user, login, logout, isAuthenticated, hasRole, updateUser } = useAuth();
// user: { id, role, campusId?, firstName, lastName, email, userType,
//         profileImage?, preferredLanguage?, preferredLocale?, timezone? }
```
`updateUser` — partial merge into user state (used by `LanguageSelector` after save).

---

## 9. i18n

**10 languages** (Arabic the only RTL) and **18 namespaces** — the canonical lists live in `src/i18n/i18n.js`
(`SUPPORTED_LANGUAGES`, `NAMESPACES`, `LANGUAGE_META`). Read them there; never restate them in code.
Translations: `public/locales/<lng>/<ns>.json`, fetched over HTTP. **`en/` is the reference locale — add the key there first.**
`common` + `errors` are eager, the rest lazy.

- **ICU format — `{variable}`, never `{{variable}}`.**
- `useAppTranslation(ns)` — **never `useTranslation()` directly.** Logs missing keys in dev.
- `useLanguage()` → `{ language, changeLanguage, isRTL, dir, supportedLangs, languageMeta }`.
  `changeLanguage(code, persist)` — `false` = preview only, `true` = cookie + localStorage + PATCH `/api/settings`.
- **`RtlProvider` wraps the whole app** (MUI direction + Emotion cache). Never remove it.
- **Never format a date manually** — `fDate / fDateLong / fDateShort / fTime / fDateTime / fDateWeekday(Long)`
  from `utils/dateFormat.js` (Intl-based, null-safe, `—` on missing).
- Yup messages follow the language automatically; custom rules use `t('errors:validation.*')` keys.
- Settings screens: drop in `<LanguagePreferencesSection>` / `<RegionalPreferences>` (self-contained preview + save).
- Before finishing: `node scripts/check-missing-keys.js`.

### Known drift — do NOT read these as the rule
- ~41 files still call `useTranslation()` directly (vs 61 migrated). The rule above holds for new/edited files;
  migrate opportunistically, don't open a campaign.
- `LANG_TO_LOCALE` in `dateFormat.js` still maps only the original 6 languages — `pt`/`it`/`ru`/`ja` fall back to `en-GB`.
- `missingKeyHandler` calls `window.Sentry?.addBreadcrumb`, but **no Sentry package is installed** — optional global, no-op today.

---

## 10. Reuse before creating

`ls src/hooks` and `ls src/components/shared` are the inventory. Listed here only where a **rule** attaches:

| | |
|---|---|
| §2 entitlement | `useFeature` / `useEntitlement` · `useModuleLabel` · `useEntitlementPilot` · `FeatureGate` · `FeatureFrozenNotice` |
| §3 danger zone | `useHardDelete` · `HardDeleteAction` · `HardDeleteDialog` |
| §9 i18n | `useAppTranslation` (replaces `useTranslation`) · `useLanguage` · `LanguageSelector` · `LanguagePreferencesSection` · `RegionalPreferences` |
| §5 entity plumbing | `useEntityManager` · `GenericEntityPage` · `FilterBar` · `KpiCard` · `BulkModals` · `ExportDialog` · `ImportDialog` · `ArchiveToggle` · `ConfirmActionDialog` · `useBulkActions` · `useRelatedData` |
| Layout | **`AppShell`** — the responsive drawer shell behind all 9 signed-in portals (nav filtering lives here, §2). `AppNavBar` is the *public/admin marketing* navbar; don't confuse them. |
| Misc | `usePaginatedList` (its `fetcher` **must** be a stable `useCallback`) · `useFormSnackBar` · `useImagePreview` |

Domain hooks follow the same conventions, one per module (`useSchedule`, `useResult`, `useFees`, `useStudentLedger`…).
Feature component folders: `ai/` · `announcements/` · `notifications/` · `documents/` · `courses/` · `results/` ·
`schedule/` · `attendance/` · `gaet/` · `portalAdmin/` · `entitlement/` · `form/` · `shared/`.

---

## 11. Conventions (non-negotiable)

- **Responsive** on every modern screen size.
- **Env vars** always via `import { API_BASE_URL } from '../config/env'` — never `import.meta.env` directly.
- **Styling — two regimes, one boundary:**
  - Signed-in app: **MUI `sx` only.** No external CSS, no Tailwind classes. `theme.palette`, never a hardcoded color.
  - Public area (`src/client/`, plus `admin/styles/Background.css`): Tailwind v4 + plain CSS are the established idiom.
    Don't convert it to MUI, and don't let it leak into the app.
- **Forms always inside a `Dialog` or `Drawer`** — never inline in a page.
- **Static config in `entityConfig.jsx`**, never inside the page component.
- **No `console.log`** in committed code (currently zero — keep it there).

### One library per need — don't introduce a second
Charts → **recharts**. Animation → **framer-motion** (public area + admin navbar only). Dates → **`utils/dateFormat.js`**
(`date-fns` is installed but used in one file — prefer the helpers). Flags → **country-flag-icons**.
Forms → **Formik + Yup** (`src/yupSchema/`, custom rules in `utils/validationRules.js`).
Upload → `ProfileImageUploader` / `ImportDialog`; **`react-dropzone` is a dependency with no call site — don't reach for it.**

---

## 12. Role layouts

One folder per role — `src/<role>/<Role>.jsx` served at `/<role>/` — and **all nine wrap `AppShell`**, declaring their own
`navItems` with `feature` keys (§2). Two exceptions: CAMPUS_MANAGER is `campus/Campus.jsx` at `/campus/:campusId/`,
and `client/Client.jsx` is the public Tailwind area with no `AppShell`.

---

## 13. Commands, CI, known debt

```bash
npm run dev       # Vite dev server (:5173, not pinned)
npm run build     # THE verification step
npm run lint      # eslint . — read the debt note first
npm run preview   # serve the production build
node scripts/check-missing-keys.js   # locale cross-check against en/, exit 1 on a missing key
```

- **No test file and no test runner exist in this repository.** Do not invent `npm test`, do not assume Vitest/Jest.
  **`npm run build` is the verification** for any change.
- **CI** (`.github/workflows/frontend.yml`, push/PR to `main`): `npm ci` → `npm run build` → `npm audit --audit-level=high`
  (blocking, currently green — no exception file needed on this side, unlike the backend's `audit-gate.js`).
  The repo root **is** the frontend: a workflow filtering on a `frontend/` sub-path can never trigger.
- **Lint debt: `npx eslint .` reports 91 errors / 12 warnings, all pre-existing** — which is why CI runs no lint step.
  **Lint only the files you touched** (`npx eslint <file>`) and never add a new error. A full-tree run looks like a
  regression you just caused; it isn't.
- Deploy: Vercel (`vercel.json`, SPA rewrite to `index.html`). Node pinned by `.nvmrc`.

---

## 14. Compaction

Preserve: current task + status (done / in progress / blocked) · files touched this session with a one-line purpose ·
any UI rule violation found and its fix (§6) · active Formik/Yup error and its resolution · i18n issue (missing namespace
or key, RTL break) and its fix · campus-isolation or routing decision (§1, §4) · **entitlement decision** (module key,
state, why fail-open applied, surface gated — §2) · **hard-delete decision** (entity key, roles from the catalogue,
`requireArchivedFirst` — §3) · cross-brick follow-up identified but not applied (§0) · next step or pending question.

Discard: JSX already written to disk, resolved stack traces, superseded design approaches.
