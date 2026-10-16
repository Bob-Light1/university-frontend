# Current task and handoff

Last updated: 2026-10-16.
Status: LOCAL IMPLEMENTATION COMPLETE — phase 1-B row 4 AI consumer acceptance.
Branch: main; initially clean. Backend roadmap row 4 remains in progress.

## Objective and changes

Continue the next phase 1-B row after delivered authentication. Canonical
[scope, audits and evidence](../../backend/docs/architecture/features/ai-operational-acceptance.md)
own this work; D2 remains bge-m3/1024d. The owner confirms no target exists and
requests local preparation and validation; no deployment or provider call.

- AiChat/Search/Analytics/Advisors reuse useFeature to disable generation when
  scoped AI is read-only, including action/Enter guards; history stays readable.
- CitationList and its callers carry the workspace campus to the existing GED
  route. DocumentManager resolves the authorized document independently of list
  pagination and refuses another campus; late responses cannot reopen a closed drawer.
- Touched AI panels use useAppTranslation and the existing ten locale catalogs.
- aiService reports incomplete SSE EOF through the translated STREAM error and
  preserves explicit cancellation and terminal done/error outcomes.

## Verification

Current ERP build passes with loopback API configuration; touched lint is clean;
190 locale/namespace combinations pass. Seven permanent backend-hosted tests execute
this actual consumer transport with isolated browser adapters. Three EOF cases
failed before correction; dropped terminal callbacks and noisy cancellation made
the other three fail. The source-type enum parity check was red before adding
the mirror. The backend permanent browser act covers both themes,
administrator/campus-manager identities, read-only/hidden/disabled states, history,
GED links and ERP figures. Final complete browser QA passes 174/174 (28 AI) on 2026-10-16; screenshots
inspected for both roles/themes and all module states. Eight targeted backend
regressions pass. The canonical note owns the full evidence and historical checks.
No environment contract, dependency or product locale changes.

## Remaining boundaries

Consumer implementation is complete; real-provider SLO acceptance waits for target
infrastructure and is tracked by backend roadmap row 4. No later phase, push or
deployment. Prior row 3 remains delivered; CH-0 and administrator acceptance remain
with their backend work items. Start a future session from context and recheck Git.
