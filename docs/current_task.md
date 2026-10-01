# Current task and handoff

Last updated: 2026-10-01.
Status: COMPLETED — AP-01 through AP-09 corrections and bounded verification.
Branch: `main`; backend: `feat/fee-receipts-and-reminders`.

## Objective and implementation

The owner authorized AP-01 through AP-09 fixes and complete verification, then
asked to resume. The cross-repository source of truth is
[the backend correction note](../../backend/docs/architecture/features/admin-portal-audit-corrections.md).

- `useCampusContext` resolves route campus for global actors and identity campus
  for scoped actors. Results, announcements, examinations and documents preserve
  it in their reads; account creation carries `schoolCampus`.
- Result services and hook propagate campus into reads and writes; changing
  context refetches data. Reference selectors use the same campus.
- Empty optional finance dates validate and submit; invalid dates show errors.
- GED lock/unlock/restore reasons require ten trimmed characters, with labels
  translated in all ten locales. Null plan uses an existing translated label.
- Backend rejects campus-less semester closure and conflicting global context,
  scopes aggregates with ObjectIds, and honors GED/mentor/staff list queries.

## Verification

Build PASS, touched-file lint PASS, locale parity 190/190 PASS. Finance schema
11/11 PASS; original blank-date cases fail. Backend full suite 76/76 and
1,610 tests PASS, API journey 21/21 PASS, SMTP 2/2 PASS, dependency gate PASS.
Canonical browser harness: 114/114 PASS with normal exit code 0; disposable
fixture self-check: 16/16 PASS. Administrator and scoped manager screenshots were
reviewed in both themes. Closing A locks 18 results and generates six transcripts
with zero errors while all B results and transcripts remain unchanged. Evidence remains private in
backend `tests/fixtures/.generated/admin-corrections/` and `.generated/visual/`.

## Preserved work and limits

Existing uncommitted Home/Login/branding/catalog changes were preserved. Their
completed September 25 audit remains in
[the public-entry note](architecture/features/public-entry-audit.md), including
1,360 browser assertions and the 164-check supplemental run. Its prior handoff
was copied to the backend correction evidence directory before this update.
The old shared Home harness's light-only assertion was updated to match the
already-approved public theme switch; no Home implementation changed here.

Full-tree frontend lint debt, four course-count snapshot failures, unexecuted
administrator combinations and unavailable external integrations are not closed
by this correction pass. No commit, push or deployment requested or performed.

## Next action

No correction step remains for AP-01–AP-09. The audit, roadmap and both handoffs
record measured results and remaining acceptance boundaries. Further roadmap
implementation requires a new owner instruction; no deployment is implied.
