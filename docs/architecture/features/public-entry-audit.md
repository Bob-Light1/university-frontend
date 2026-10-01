# Public entry presentation audit

Date: 2026-09-20. Status: completed; local integration verified in the handoff.

## Problem and scope

Owner requested corrections to Home/Login navbar placement, sign-in visibility,
light/dark coherence and international usability. Only frontend public presentation
and the shared login component change. Preserve prior contact/branding and Home
atmosphere work. No new Login animation, dependency, environment or API change.

## Contract and acceptance

Preserve theme storage/system resolution, seven public roles, administrator form,
login payloads/redirects, all ten catalogs and existing commercial destinations.
Sign-in stays visible on mobile. Visual order matches keyboard order. Native role
buttons support Space/Enter; focus follows steps. Validate both themes, narrow and
wide screens, RTL, translations, error associations, contrast and reduced motion.
Campus scope, deletion, authorization and entitlement are unchanged.

## Registry review

1. API mounting: unchanged.
2. Module facades: unchanged.
3. Feature constants: unchanged.
4. Hard deletion: unchanged.
5. Soft deletion: unchanged.
6. Jobs: unchanged.
7. Fixture counts: unchanged; no account data used.
8. Catalogs: existing labels reused in all ten locales.
9. Services/navigation: public navbar only; no service contract change.
10. Course hooks: no move/rename; references checked.
11. Engineering map: existing subsystem map remains accurate.

## Regression evidence

Before changes, nine browser assertions failed: mobile sign-in visibility, desktop
button differentiation, visual/tab order, themed Login background, reduced motion,
Space activation, step focus and identifier/password error associations. They
passed against the first prepared version. A runtime reset removed temporary files
and interrupted the extended matrix after six locales; partial results are not
counted as final. Restored sources and new evidence live in backend
`tests/fixtures/.generated/public-ui-audit/`, which survives session restarts.

## Delivered changes

- Navbar groups brand, navigation/language, theme and sign-in in reading order.
  Sign-in is a filled 44px action and remains visible with the mobile menu closed.
  Long deployment names truncate visually while retaining the full accessible name.
  Mobile menus focus their first link, close with Escape/outside focus, reset after
  navigation/desktop resize and scroll within short landscape viewports.
- Login background follows the public light/dark palette. Role cards are native
  buttons, no role is misleadingly preselected, and step changes move keyboard
  focus into view. Continuous login decorations were removed; Home motion remains.
- Form titles, submit buttons and input boundaries have legible theme-aware colors.
  Identifier/password errors have explicit associations. Email keyboards and
  password-manager autocomplete are preserved. Public/admin API payloads and
  redirects remain unchanged. The shared administrator form renders successfully.
- Dark feature-card hover keeps a dark icon surface and a contrasting icon.

## Final checks and audits

- Production build: PASS, existing bundle-size warning.
- Touched JSX lint and browser-script syntax: PASS. The prior LoginPage unused
  destructured Icon lint error is also removed.
- Locale parity: PASS, 190 locale/namespace combinations; no new translation keys.
- Browser matrix: PASS, 516 assertions, all ten locales, all seven public roles,
  Home/role-picker/forms, light/dark, widths 320/390/768/1100/1101/1280/1440,
  RTL, field/CTA contrast, keyboard/focus, reduced motion, theme persistence/system
  changes, short landscape menus, long deployment name and administrator form.
- Additional field-boundary checks failed in both themes before the border fix.
  The hidden-sign-in negative control fails at the intended visibility assertion.
  Test review strengthened visibility checks to include CSS visibility explicitly.
- Screenshots inspected: Home, role picker and forms, FR/AR, desktop/mobile and
  light/dark. Screenshots/logs: backend `tests/fixtures/.generated/public-ui-audit/`.
- Course references/hooks: PASS. Executable course baseline before integration:
  65/67 pass, 14 snippets skip; F2.4/F2.5 fail on existing stale counts. Earlier
  F2.2/F2.3 failures do not reproduce in this run. Course source is unchanged.

Code review checked navigation order, menu cleanup, focus, CSS scope, RTL, palette
states and the existing theme store. Platform review checked shared administrator
Login, public contact/navigation and unchanged identity/authorization boundaries.
Test review checked pre-fix failures, browser geometry/composited contrast and a
negative control. No feature/roadmap phase or QA work item changes status.

## Limits

This validates the requested public presentation. It is not a platform-wide release
certification: backend/API authentication journeys, dependency audit, authenticated
role/entitlement matrix, portal and AI suites were not rerun. Existing full-tree
frontend lint debt and the two course baseline failures remain outside this scope.
No commit, push or deployment performed.

## Theme follow-up — 2026-09-25

Status: completed; installed-file verification is recorded in the handoff.
Owner requested a complete light/dark audit of Home and public Login on phone and
desktop. Preserve existing atmosphere, branding, contact, translations and routes.

### Reproduced findings and corrections

| Finding | Before | Correction |
| --- | --- | --- |
| Secondary Home text in light mode | Preview labels, chart indices, explanatory text, section numbers and footer text measured 2.39–4.43:1 | Reuse the existing `--muted` token, including its dark value |
| Partner branding copy on desktop | Translucent white body copy measured 3.97:1 in both themes, before accounting for the light decorative overlay | Opaque copy on the solid role color; remove the overlay |
| Invalid credential fields | Focusing/hovering an invalid field changed its red border to the role accent while the error label remained red | Shared input styles apply role accents only to valid, enabled fields |
| Open-tab theme consistency | Toggling Login to light left Home dark in another tab | Subscribe to local-storage events, notify without writing back, handle removal/clear and unsubscribe cleanup |

All three frontend source files are scoped to these corrections: `home.css`,
`LoginPage.jsx` and `themeMode.js`. The shared Login administrator variant is
checked because it uses the same input styles. The theme store retains the
existing default, explicit/system preferences and in-memory behavior when storage
is unavailable. No new user-facing text or configuration is required.

### Regression and review

`public-entry-qa.cjs` now checks small text, opacity and MUI's dark elevation layer,
focused/error fields, password visibility and value preservation, assistance
modal normal/hover states, and two-tab synchronization in addition to the existing
responsive, keyboard, persistence, system, RTL and seven-role matrix.
`theme-mode-qa.mjs` exercises real store subscriptions, storage-area filtering,
invalid values, removal/clear, no-op notifications, cleanup and blocked storage.
The original store fails its cross-tab assertion; the corrected store passes.
Browser probes retain before/after colors and partner contrast measurements.

Code review verifies semantic error precedence and the shared style object.
Platform review covers the shared administrator form and theme subscriptions;
API payloads, redirects and authenticated preferences are unchanged. Test review
adds explicit tab activation and waits for responsive menu state before the next
resize, avoiding background-tab hangs and sampling intermediate layout state.

The eleven-registry review above remains applicable: no API/facade, feature,
deletion, job, fixture count, catalog key, service, navigation contract, course
structure or engineering-map change. No roadmap phase or QA work item moves.

### Current checks and limits

Production build, touched-source/script lint, focused store checks and all 190
locale/namespace combinations pass. The production browser matrix passes 1,360
assertions across all ten locales, seven public roles, both themes and widths
320/390/768/1100/1101/1280/1440. A supplemental run of the final script passes
164 assertions, including a locally intercepted pending/failed login and the
shared administrator form at 320/1440 in both themes. No authentication API was
contacted by the synthetic failure check. FR/AR Home, role-picker and form
screenshots were visually reviewed on phone and desktop in both themes.
Bundle-size warnings remain.
The first dev runs shared an optimizer cache and are not passing evidence;
production preview is used for the final matrix. Two initial multi-tab probes
needed foreground-tab activation and were rerun.

This is public presentation validation, not successful-authentication or full ERP
release validation. Existing unrelated frontend lint and historical course-count
failures remain outside scope. No dependency, API, business rule, campus,
entitlement, deletion, environment, portal or AI behavior changes.

Evidence: backend `tests/fixtures/.generated/theme-audit-2026-09-25/` contains
build/lint/locale logs, measured before/after browser probes, the failing original
store control, final store results, both browser reports and screenshots. The
handoffs distinguish these checks from the historical September 20 audit.
