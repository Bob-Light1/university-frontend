# Current task and handoff

Last updated: 2026-10-23.
Status: IN PROGRESS — phase 1-B row 5 online admission.
Branch: main; preserve pre-existing AGENTS/context edits.

The owner approves candidate/private-email-link and manager dossier uploads,
campus-configurable requirements with none required by default, and management
finalization. Director/admin alone pronounces admission; no payment prerequisite.
[Backend design/evidence](../../backend/docs/architecture/features/online-admission.md)
owns scope, audits, tests and delivery gates.

Implemented: lead service/revision contract, serialized dossier hook, private
file/config/access controls in LeadDetailDrawer, validated enrollment form,
activation display/reissue, role/state guards, shared constants and ten locales.
The existing partner route/navigation and Axios/session transport remain in use.
API environment is VITE_API_BASE_URL (including /api), plus existing media/portal URLs.

The reviewed sources are synchronized into this checkout. The owner now requests
a checkpoint commit; admission remains in progress.
The staged build passes with explicit loopback API configuration; earlier touched
lint and 190 locale/namespace combinations pass. Browser acceptance is incomplete:
a fresh configured build is ready. An earlier automatic-review quota rejection
prevented its browser replay; scoped synchronization/pre-commit checks now resume. No
push or deployment. Final lint/locale/build and full browser replay remain required.

Manual cases ERP-ADM-001–005 are proposed in the prepared Workbench payload;
the owner says editor membership will be granted. Verify and register before closure.
Do not mark row 5 delivered or start a dependent row while its acceptance is pending.
AI provider SLOs, CH-0 independent acceptance, GED release DDL and hosted CI retain
their existing backend-owned boundaries.

## Pre-commit verification — 2026-10-23

Current synchronized-source checks pass: backend admission/contract/redirect suites
44/44, portal 52/52 with lint and TypeScript, ERP touched lint and 190 locale/
namespace combinations. The complete separate course guard passes 67/67 and
references resolve. These supplement the dated build results above; final browser,
latest production build and manual-case acceptance are still pending. The owner
explicitly requests the local checkpoint commits; no push or deployment.
