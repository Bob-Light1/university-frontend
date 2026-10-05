# Current task and handoff

Last updated: 2026-10-05.
Status: COMPLETED — phase 1-B row 2, mentor entitlement guards.
Branch: `main`; starting commit: `8ea84f1`; working tree was clean at task start.

## Objective and changes

Continue backend roadmap row 2, following browser verification before legacy
entitlement retirement. The backend owns [the contract and evidence](../../backend/docs/architecture/features/entitlement-legacy-retirement.md).

- `src/App.jsx`: compose the shared mentor feature guard inside the role guard,
  before mounting the workspace; hidden mentor renders the translated refusal.
- `src/mentor/components/dashboard/MentorDashboard.jsx`: gate Results/Courses
  shortcut grid items with FeatureGate. Read-only Results stays visible; hidden
  Courses disappears. A focused browser replay failed before this correction.
- `src/services/admin_service.js`: correct the retired-route comment; no active
  client called the removed AI-only administration endpoint.
- `CLAUDE.md`: document both shared guards.

## Verification

The current loopback build passes (`VITE_API_BASE_URL=http://localhost:5000/api`,
output `/tmp/roadmap-row2-frontend-dist-2026-10-05`). Touched-file lint passes with
one existing unused-disable warning; the localization check passes, no new keys.
The final browser replay passes 134/134 (exit 0), including shortcut visibility
and actual saved light/dark themes. Screenshots inspected for parent, mentor and
staff, plus the hidden mentor refusal. The old shortcut failed the focused browser
regression before the fix. Backend delivery evidence owns all replay artifacts.
Heavyweight checks ran sequentially.

## Remaining boundaries

No implementation work remains for this consumer. Backend, frontend and course
changes are recorded together in separate local commits. No production database
or remote publication is part of this task. CH-0 independent acceptance and earlier
administrator acceptance remain under their existing backend work items.
