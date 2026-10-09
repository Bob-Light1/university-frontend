# Current task and handoff

Last updated: 2026-10-09.
Status: COMPLETED — phase 1-B row 3, authentication session hardening.
Branch: `main`; sibling backend starts at `8c6cfa4`.

## Objective and implementation

Continue the backend authentication hardening row. The backend owns the
[contract and evidence](../../backend/docs/architecture/features/auth-session-hardening.md).

- `src/api/sessionClient.js`: cookie login/rotation/logout, identity checks,
  request coalescing and supported cross-tab Web Locks.
- `src/api/axiosInstance.js`: current identity per request, one expired-access
  retry, revocation cleanup and delayed-response identity guards.
- `src/context/AuthContext.jsx`: verified session bootstrap, server logout,
  preference restoration and cross-tab identity synchronization.
- SSE obtains fresh access; campus creation/listing and upload-signature calls
  use the shared API transport. External Cloudinary transport stays separate.
- Retired nonexistent auth-service endpoints replaced with the actual contract.

## Verification on 2026-10-09

Final loopback build passes (`/tmp/row3-frontend-dist-current`). Touched lint has no
errors or warnings. Localization passes 190 combinations, no new keys. Backend
transport tests pass 8/8; both delayed-response scenarios were red before their
fixes, including identity changes while awaiting a request token. Complete browser
QA passes 146/146. Final-build authentication replay passes 12/12 across real
administrator/manager login, HttpOnly cookie, expired access on reload, saved
light/dark theme and server logout. Screenshots inspected. Backend evidence owns
full tests, audit and disposable database results. Logs: `/tmp/row3-checks`.

## Remaining boundaries

No implementation work remains for this consumer. Coordinated conventional local
commits cover backend, frontend and course; no publication or deployment.
Production requires the configured HTTPS cookie/CORS origins and a fresh login
for old tokens. CH-0 and earlier administrator acceptance remain with their
backend work items; no subsequent row is started automatically.
