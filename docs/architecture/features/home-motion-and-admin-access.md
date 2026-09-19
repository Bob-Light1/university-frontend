# Home motion and administrator access

Date: 2026-09-19. Scope: frontend refinement requested by the owner.
Extends the [product home design](../../../../backend/docs/architecture/features/product-home-and-branding.md).

Restore three footer-logo activations within two seconds to `/admin/login`, with
native button keyboard support and a translated accessible instruction. The direct
URL remains available. This shortcut grants no authentication or authorization.

Use the existing Framer Motion dependency for staggered entrances, once-per-visit
scroll reveals, chart transitions and a restrained pointer-driven 3D preview.
Decorative opening motion ends within five seconds; no perpetual animation.
Respect reduced motion, touch input, keyboard focus, all ten locales and RTL.
Keep the local synthetic preview and existing commercial destinations.

Only the frontend changes. No API, model, campus scope, deletion, entitlement,
backend route, facade, feature constant, deletion registry, job, fixture count or
service contract changes. Translation catalogs change; route registration and
course paths remain unchanged. No new product module or roadmap phase.

Validation: production build, touched-code lint, locale parity, browser checks for
shortcut timing, keyboard, preview tabs, responsive widths, RTL and reduced motion;
visually inspect screenshots. Review code, shared-footer effects and test sensitivity.

## Browser regression harness

Run `node scripts/home-motion-qa.cjs` with Vite on port 5173, a sibling backend
installation containing `puppeteer-core`, and Chrome available. Override
`HOME_QA_ORIGIN` or `PUPPETEER_EXECUTABLE_PATH` when needed. Artifacts go to
`/tmp/home-motion-*.png` and `/tmp/home-motion-qa-result.json`.
`HOME_QA_MUTATE_ADMIN_COUNT=1` changes only the browser-served footer module to
navigate after two activations; the normal two-click assertion must fail.
No production source is mutated by this negative control.

## Verification and review — 2026-09-19

Production build and touched-code lint passed. Locale check passed all 190
locale/namespace combinations. Chrome QA passed pointer depth, tabs, timing
expiration, mouse/Enter/Space/touch activation, FR/AR at 360/390/768/1440 px,
reduced motion and absence of page errors. Desktop and mobile screenshots were
visually inspected. The two-activation negative control failed at the expected
assertion; the unmodified implementation passed. Browser launch required the
approved execution outside the sandbox.

Code review confirmed a rolling two-second window, count reset on blur and after
navigation, native button semantics, translated instructions, and no authorization
bypass. Platform review confirmed the shared footer remains usable on public
routes, the header retains the Home link, pointer effects stop during keyboard
focus, decorative motion ends, and no business API or dependency was introduced.
The test review verified the intentional wrong-count failure. Existing build
warnings concern chunk size and old Browserslist data. Backend/portal/full signed-in
role and entitlement suites were not rerun for this public frontend refinement;
this is not a new cross-repository release certification.
