# Frontend agent instructions

## Start and resume

- Read [project context](docs/context.md) and [current task](docs/current_task.md) once at session start.
- Check `git status --short`, the branch and the relevant diff before editing. Preserve unrelated work.
- These are separate repositories, not a monorepo. Verify sibling paths before use.
- Read the detailed references required for the task before implementing; these summaries do not waive their rules.
- A handoff is a dated snapshot, not permission to start its suggested follow-up. The user's current request determines scope.
- Use `rg` and bounded reads; exclude dependencies, caches, build output and generated fixtures from broad searches.
- Write code, comments and documentation in English; preserve product translations in their target languages. Reply in the user's language.
- Never document secrets, real personal data or generated fixture credentials.
- Update `docs/current_task.md` at meaningful milestones and before handing off implementation work: objective, decisions, files, checks, blockers and next action.
- Keep stable navigation in `docs/context.md`; link to canonical decisions rather than copying them. Do not create commits solely for a handoff.
- Distinguish checks run now from historical results. Documentation-only changes need link, accuracy, whitespace and Git-ignore/tracking checks; application changes require the relevant workflow below.

## Task references and invariants

- Read [CLAUDE.md](CLAUDE.md) §§0–0.2 for code changes, then the applicable sections. Read it in full before adding a module, as required by the README.
- Routing/security: §§1–4, 7–8, 12. Campus isolation fails closed; entitlement display defaults fail open and never replace authentication. Use `useFeature`, `FeatureGuard` and the server hard-delete catalogue.
- UI/forms: §§5–6, 10–12. Reuse `GenericEntityPage`, shared hooks and components. Preserve the MUI Select/Grid/Dialog rules; signed-in screens use theme-aware MUI, the public client area uses its established CSS/Tailwind.
- API contracts originate in the backend. Update services, hooks and affected consumers together. Use the Axios singleton; preserve the existing documented SSE transport in `src/services/aiService.js`.
- Localization: §9 and `src/i18n/i18n.js`; use the live locale/namespace lists, English reference keys and ICU formatting. Preserve RTL and every locale.
- Environment: §11, `src/config/env.js`, `src/config/brand.js` and `.env.example`. Keep applicant intake in the separate portal.
- Feature delivery across repositories follows [backend CLAUDE.md](../backend/CLAUDE.md) §12, including required design, tests, audit, browser QA and registry/status updates. Read the relevant design note before changing its subsystem.
- For application changes, run `npm run build`, lint touched code, and run `node scripts/check-missing-keys.js` for localization. No `npm test` script exists. Historical lint counts and CI results are not current evidence.
