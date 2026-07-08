/**
 * @file Director.jsx
 * @description Director portal layout — thin wrapper around AppShell.
 * Accessible only to authenticated DIRECTOR role.
 */

import DashboardIcon    from '@mui/icons-material/Dashboard';
import BusinessIcon     from '@mui/icons-material/Business';
import AutoAwesomeIcon  from '@mui/icons-material/AutoAwesome';

import AppShell from '../components/AppShell';
import { useAppTranslation } from '../hooks/useAppTranslation';

// Nav config — labels resolved through `t()` at render time (see Staff.jsx).
const NAV_CONFIG = [
  { link: '/director/dashboard', tKey: 'common:nav.dashboard', icon: DashboardIcon },
  { link: '/director/campuses',  tKey: 'nav.campuses',         icon: BusinessIcon  },

  // ── AI workspace (Phase 3 — chat · search · analytics · advisors) ──
  { type: 'divider', label: 'divider-ai' },
  { link: '/director/ai', tKey: 'nav.aiWorkspace', icon: AutoAwesomeIcon, accent: '#7b2ff7' },
];

export default function Director() {
  const { t } = useAppTranslation(['admin', 'common']);

  const navItems = NAV_CONFIG.map(({ tKey, ...rest }) =>
    tKey ? { ...rest, label: t(tKey) } : rest,
  );

  return (
    <AppShell
      navItems={navItems}
      drawerLabel={t('director.label')}
      pageTitle={t('director.pageTitle')}
    />
  );
}
