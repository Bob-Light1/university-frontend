# Current task and handoff

Last updated: 2026-09-19.
Status: COMPLETED — Frontend CI dependency security audit fix.
Branch observed: `main`.

## Dependency security audit — 2026-09-19

Objective: resolve the failing GitHub Actions security audit. The working tree
was clean at the start. A fresh npm audit reproduced two high findings
(`browserslist`, `js-yaml`) and two moderate findings (`@humanfs/node`,
`baseline-browser-mapping`), all in transitive development dependencies.

Ran `npm audit fix` without `--force`: only `package-lock.json` changed.
Patched versions are browserslist 4.29.0, js-yaml 4.3.2, @humanfs/node 0.16.8
and baseline-browser-mapping 2.11.25, with their supporting dependencies.
The immediate audit reports zero vulnerabilities. Package declarations, the
CI security threshold and Node configuration remain unchanged.

Checks run now: clean `npm ci` passed; `npm audit --audit-level=high` passed with
zero vulnerabilities; `npm run build` passed; all 190 locale/namespace combinations
passed. The initial build was interrupted without a final result, then rerun
successfully. No application source changed, so touched-source lint does not
apply. Whitespace, tracking and ignore checks passed; no documentation links
were added. Registry access required execution outside the network-restricted
sandbox. No commit or push has been performed.
Next action: review and commit the lockfile and this handoff, then push to rerun CI.

## Local integration — 2026-09-19

User requested merging `feat/fee-receipts-and-reminders` into `main` locally;
the user will push. Completed a conflict-free fast-forward from `67104bf` to
`9b5994f`, including the payment PDF receipt and product Home commits. No push
or deployment was performed. The user confirmed Vercel tracks `main`.
Git ancestry and branch state were checked during this task; application checks
were not rerun for this Git-only integration. Next action: user runs
`git push origin main`, then verifies the Vercel production build. This handoff
update is left uncommitted and is not required for deployment.

## Objective and completed work

Create a compact startup protocol and project map consistent with local engineering
references and the actual working tree. Added `AGENTS.md`, `docs/context.md` and this
handoff. No application source, dependency or deployment changes were made.
Corrected the local README and applicable detailed guides against source: current
architecture/status, configuration and documented integration exceptions. Updated
the context map to remove resolved drift notices; preserved canonical decisions.

## Existing work and limitations

Existing uncommitted product-home/branding, translations, environment and legacy entitlement/dashboard changes were present. They were preserved. The previous backend handoff reports functional QA completed but existing ERP lint and backend dependency-audit release gates remain; see the owning product-home design.
See the [product-home design](../../backend/docs/architecture/features/product-home-and-branding.md)
and [AI design](../../backend/docs/architecture/PHASE3_AI_DESIGN.md) for their owning records.
This task does not approve follow-up product or operational work.

## Verification and next action

Reviewed local guides, relevant source/configuration, Git status and existing documentation
diffs. Checked new local link targets, whitespace and Git ignore visibility.
No application suite, build, live service or deployment check was run for these documentation-only changes.
Files are left uncommitted. Start the next requested task from [context](context.md),
verify the working tree, and read the task-specific references required by [AGENTS.md](../AGENTS.md).

## Home refinement — 2026-09-19

Restore the timed footer shortcut to `/admin/login` and add restrained accessible
motion and interactive 3D depth using the existing animation dependency. Design:
[Home motion and administrator access](architecture/features/home-motion-and-admin-access.md).
Preserved the prior integration note. No authentication or authorization changes.

Implementation: `Home.jsx` reveals sections once; `ProductPreview.jsx` adds
pointer-driven perspective and chart/tab transitions; `home.css` adds finite hero
entrances, decorative depth and hover feedback; `Footer.jsx` restores the timed
shortcut with mouse/keyboard support. Added `adminShortcut` to all ten home
catalogs and `scripts/home-motion-qa.cjs` for repeatable browser checks.

Checks run now: production build passed (existing chunk-size and Browserslist
warnings); touched JSX lint passed; all 190 locale/namespace combinations passed.
Final Chrome QA passed timing/reset, mouse, Enter/Space, touchscreen activation,
preview tabs, FR/AR at 360/390/768/1440 px and reduced motion, without page errors.
Desktop and FR/AR mobile screenshots were visually reviewed. The browser-only
negative control changed the trigger to two activations and failed precisely at
the two-click assertion, as expected. Production sources were not mutated.
Chrome required execution outside the sandbox; the sandbox attempts could not
start the browser. Touched JSX and the browser harness pass lint. Documentation
links, Git visibility and whitespace checks passed.
The local backend, authenticated-role suite, portal and dependency audit were not
rerun for this frontend-only refinement; prior results remain historical.
No dependency, lockfile, route, API or registry contract changed. No commit or push.
Next action: owner reviews the local Home changes; no implementation blocker remains.
