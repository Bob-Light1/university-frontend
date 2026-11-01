# Current task and handoff

Last updated: 2026-11-01.
Status: COMPLETED — phase 1-B row 7 WhatsApp Business, source/local acceptance.
Branch: main. Scoped local commits requested; no push, deployment or live Meta send.

## Delivered scope

The [backend contract and evidence](../../backend/docs/architecture/features/whatsapp-business.md)
own D-R11 quotas 500/2,000/5,000 per campus/UTC month, four event families,
approved templates, explicit phone-bound consent and external activation.

Shared identity-local consent hook, Formik/Yup dialog and account-menu entry serve
all nine authenticated roles. Shared/parent legacy WhatsApp switches and summary
chips are retired. The delivery log shows separate provider receipts, safe translated
reasons and server-owned monthly usage; started submissions cannot be replayed.
All ten locales are wired through existing Axios/session transport and
VITE_API_BASE_URL. No new public-portal/AI contract or environment variable.
Bounded existing AppNavBar/ParentProfile lint corrections accompany the touched UI.

## Observed verification

Actual frontend production build, touched-file lint and 190 locale/namespace
combinations pass. Backend full Jest passes 99 suites / 1,815 tests; later
settings extraction passes 39 targeted tests and 102 facade assertions. The owned
WhatsApp real-data journey passes 48/48; fixture/base checks pass 36/36 and 25/25.
Complete browser replay passes 224/224, including 22 WhatsApp checks, with the
focused flags unset. All six final consent/log captures are inspected in both
themes for administrator and campus manager; enabled/read_only/hidden originating
modules retain readable core history. Backend lint/audit and course 67/67 pass.

ERP-WA-001–005 are registered through the existing Workbench editor and CLI;
exact saved/revision bodies, unchanged prior cases/revisions and idempotent import
are verified. No manual verdict is claimed. The backend note retains the failed
readiness attempts and their corrections; no deliberate mutation remains.
No executable frontend source changed after the validated build.

## Remaining boundary

No frontend implementation remains for this work item. No Meta account/configuration
exists; real activation remains separate under the owner-approved backend runbook.
CH-0 independent review, deployed AI SLOs, GED release DDL and hosted portal CI
keep their owning gates. No later roadmap phase or independent Workbench increment.
