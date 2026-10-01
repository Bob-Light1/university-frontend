# Home contact and theme

Date: 2026-09-19. Status: implementation in progress.

## Problem and scope

Make contact discoverable from the public navigation, hero and footer, and allow
visitors to switch between light and dark presentation on desktop and mobile.
This user request supersedes the light-only decision in the
[original product design](../../../../backend/docs/architecture/features/product-home-and-branding.md).

| Brick | Change |
| --- | --- |
| Frontend | Public navigation, contact page, scoped CSS and translations |
| Backend, portal, AI service | No changes |

## Contract

Reuse `setThemeMode` and the resolved MUI palette; retain the existing `erp_theme`
persistence and system-mode resolution. The switch is visible outside the mobile
menu. Public CSS follows `html[data-theme]`, without changing authenticated CSS.
Contact remains at `/contact`; validated `BRAND.salesHref` determines its action.
Without a destination, explicitly state that online contact is unavailable instead
of presenting a preview link as a contact action. Never invent contact details.
The real commercial destination is pending owner input.

## Campus scope, deletion and entitlement

No business requests, entities, permissions, campus scope or entitlement changes.

## Registries

Only public navigation and all ten home translation catalogs change. API routes,
facades, feature constants, hard-delete, soft-delete, jobs, fixture counts, AI and
portal registries are unaffected. No new module or dependency.

## Verification

Build, touched-source lint, locale parity, whitespace and documentation checks;
browser checks for theme toggling/persistence, contact navigation, mobile menu,
FR/AR responsive layouts, system preference, and screenshots in both themes.
