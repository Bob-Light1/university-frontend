# Frontend project context

Last documentation review: 2026-09-19. Navigation map, not deployment certification.

## Scope and neighboring repositories

React 19 / Vite 7 ERP SPA, MUI v7, React Router v7, Formik/Yup and i18next.
Nine authenticated role areas share `AppShell`; the public client area presents the software.
Applicant intake belongs to [the Next.js portal](../../../partner/AGENTS.md).
The [backend](../../backend/AGENTS.md) defines API contracts and business authorization.
The [AI service](../../ai-service/AGENTS.md) is reached through the backend, never directly.

## Read by task

| Entry | Responsibility |
|---|---|
| [main.jsx](../src/main.jsx), [App.jsx](../src/App.jsx) | Provider ordering and route mounting |
| [routes](../src/routes/) | Role, campus and feature guards; route fragments |
| [context](../src/context/), [hooks](../src/hooks/) | Identity, entitlement and domain state |
| [services](../src/services/), [Axios singleton](../src/api/axiosInstance.js) | API contracts and shared interception |
| [shared components](../src/components/shared/), [AppShell](../src/components/AppShell.jsx) | CRUD, dialogs, role navigation and feature filtering |
| [client](../src/client/), [brand configuration](../src/config/brand.js) | Product home, synthetic preview and deployment identity |
| [i18n registry](../src/i18n/i18n.js), [locales](../public/locales/) | Ten languages, live namespaces, English reference and RTL |
| [environment](../src/config/env.js), [sample](../.env.example) | API/media origins, portal URL and branding variables |
| [package.json](../package.json) | Available commands and declared dependencies |

## Detailed references

[AGENTS.md](../AGENTS.md) provides the short reading protocol; [CLAUDE.md](../CLAUDE.md)
is the engineering reference and [README](../README.md) covers local setup.
Product decisions/status belong to the [backend roadmap](../../backend/docs/architecture/ERP_ROADMAP.md)
(§0, §3, §14 and the affected phase); QA status belongs to its
[QA strategy](../../backend/docs/architecture/QA_TEST_STRATEGY.md).
Use the [entitlement design](../../backend/docs/architecture/CAMPUS_ENTITLEMENT_DESIGN.md),
[AI design](../../backend/docs/architecture/PHASE3_AI_DESIGN.md) and
[product home design](../../backend/docs/architecture/features/product-home-and-branding.md)
when touching those features. A feature's presence does not prove release readiness.

## Documentation maintenance

The README and CLAUDE guide now use the live namespace registry, document the
existing SSE transport exception and avoid presenting historical lint/CI results
as current evidence. Recheck the relevant commands for each implementation task.

See [current task](current_task.md) for the dated working-tree snapshot.

Authentication lifecycle: [backend session contract](../../backend/docs/architecture/features/auth-session-hardening.md), `src/api/sessionClient.js` and `src/context/AuthContext.jsx`.

## Manual QA Workbench

[QA Workbench](../../../qa-workbench/README.md) is the independent manual-test workspace. Its source
lives in `/home/adminsecu/Projects/qa-workbench`; it has its own design, roadmap
and agent handoff. Consult its README for verified hosting status and setup.
Each product change must reference affected manual case IDs or explain its lack
of manual-QA impact. This support does not replace automated checks, CH-* acceptance
or the product-roadmap phase order. Initial campaigns target local synthetic ERP data.

Admission management: [canonical contract](../../backend/docs/architecture/features/online-admission.md),
`src/campus/components/partners/LeadDetailDrawer.jsx`, `src/hooks/useAdmissionDossier.js`
and `src/config/admissionConstants.js`. Candidate intake remains in the separate portal.
