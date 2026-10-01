# Home ambient background

Date: 2026-09-20. Status: implemented and verified; awaiting owner visual review.

## Problem and scope

Owner-approved Home-only refinement: slow atmospheric motion with gentle mouse
acceleration. Preserve existing local contact/theme changes and page content.
Supersedes the no-perpetual-motion decision in
[Home motion](home-motion-and-admin-access.md) for this decorative background only.

## Bricks and contract

Frontend only. Three gradient layers with compositor transforms; no assets,
requests or dependencies. Speed capped at 1.65 times idle and smoothly decaying.
Touch keeps autonomous motion. Live reduced-motion preference gives a static
composition. Translated keyboard-accessible pause/resume persists for the session.
Hidden documents and offscreen Home suspend work; unmount cancels animations and
listeners. Support both themes, RTL and all ten locales. Decoration is aria-hidden.
No data, campus, deletion, entitlement or API changes.

## Registry review

API routes, facades, feature constants, hard-delete, soft-delete, jobs and fixture
counts: unchanged. Catalogs: two Home labels in ten locales. Services/navigation:
unchanged. Course hooks: no moves or renames; verify structural references.
Engineering map: existing Home entry remains accurate. No roadmap phase or QA
work item changes; this is a refinement of the existing Home.

## Acceptance

Production build, touched-code lint, locale parity, course references; browser
checks for idle motion, pointer acceleration/settling, pause persistence,
visibility, reduced motion, route cleanup, touch, RTL, widths and themes.
Visually inspect screenshots and run existing Home regressions. Review code,
platform effects and test sensitivity. This does not certify platform release gates.

## Review and regression evidence

The first browser run showed real mouse events while the environment reported no
fine primary pointer. Acceleration stayed at 1.0 and the acceleration assertion
failed. Reacting to `pointerType === 'mouse'` now supports hybrid devices without
reacting to touch gestures; the same assertion passes after the correction.

Code review: bounded velocity impulse, smooth exponential settling, independent
compositor animation, no permanent JavaScript frame loop at idle, stable animation
instances across pause/resume, safe session storage, live reduced-motion listener,
visibility/intersection suspension and full route cleanup. Platform review: only
Home mounts the component; selectors are scoped and existing contact/theme work
is preserved. No business requests, foreground transforms or new dependencies.

Course checks ran against the original repositories before applying this work:
all cited references and course hooks resolve; 63/67 executable solutions pass,
14 illustrative snippets skip. Four existing F2 checks fail (F2.2/F2.3 execution
checks and F2.4/F2.5 stale source/suite counts). These failures predate this change;
no course source was changed. Backend suites, dependency audits, portal, AI and
signed-in browser journeys were not rerun for this isolated public UI refinement.

## Final verification — 2026-09-20

- Final production build: PASS (existing chunk-size warning).
- Touched JSX lint: PASS; all 190 locale/namespace combinations: PASS.
- New Chrome suite: PASS for actual idle drift, bounded acceleration/settling,
  continuous pause/resume, session persistence, keyboard, background tab and
  offscreen suspension, live reduced motion, route cleanup, touch, French/Arabic
  at 360/390/768/1440 px, both themes, no page errors.
- Freeze negative control: fails at `idle background must actually move`, as
  intended, without mutating production source.
- Existing `home-motion-qa.cjs`: PASS, including preview tabs, pointer depth,
  administrator shortcut timing, mouse/keyboard/touch, RTL and reduced motion.
- Desktop/mobile light/dark and Arabic screenshots visually inspected. Evidence
  lives in `/tmp/home-ambient/`; final preview images are `preview-light.png` and
  `preview-dark.png`. Final logs: `build-final.log`, `lint-final.log`, `locales.log`,
  `browser-final.log`, `negative.log`, `existing-motion.log`, `course.log`.

A test-harness race on deferred Home loading was corrected by waiting for the
actual ambient elements before assertions. The corrected full suite passes.
Browser launch, Vite cache writes and frontend integration require sandbox
escalation from the backend workspace. No external publication was performed.
