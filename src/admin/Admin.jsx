/**
 * @file Admin.jsx
 * @description Admin / Director portal layout — thin wrapper around AppShell.
 * Accessible only to authenticated ADMIN and DIRECTOR roles.
 */

import DashboardIcon       from '@mui/icons-material/Dashboard';
import BusinessIcon        from '@mui/icons-material/Business';
import AddBusinessIcon     from '@mui/icons-material/AddBusiness';
import ManageAccountsIcon  from '@mui/icons-material/ManageAccounts';
import CampaignIcon        from '@mui/icons-material/Campaign';
import FormatQuoteIcon     from '@mui/icons-material/FormatQuote';
import HelpOutlineIcon     from '@mui/icons-material/HelpOutline';
import MenuBookIcon        from '@mui/icons-material/MenuBook';
import EmojiEventsIcon     from '@mui/icons-material/EmojiEvents';
import HandshakeIcon       from '@mui/icons-material/Handshake';
import AutoAwesomeIcon     from '@mui/icons-material/AutoAwesome';

import AppShell from '../components/AppShell';
import { useAppTranslation } from '../hooks/useAppTranslation';

// Nav config — labels are resolved through `t()` at render time (see Staff.jsx).
// `tKey` points into the `admin` namespace unless prefixed with `common:`.
// Divider items keep a stable string `label` used purely as a React key.
const NAV_CONFIG = [
  { link: '/admin/dashboard',      tKey: 'common:nav.dashboard',     icon: DashboardIcon      },
  { link: '/admin/campuses',       tKey: 'nav.campuses',             icon: BusinessIcon       },
  { link: '/admin/new-campus',     tKey: 'nav.newCampus',            icon: AddBusinessIcon    },
  { link: '/admin/accounts',       tKey: 'nav.adminAccounts',        icon: ManageAccountsIcon },
  { link: '/admin/announcements',  tKey: 'common:nav.announcements', icon: CampaignIcon       },

  // ── AI workspace (Phase 3 — chat · search · analytics · advisors) ──
  { type: 'divider', label: 'divider-ai' },
  { link: '/admin/ai', tKey: 'nav.aiWorkspace', icon: AutoAwesomeIcon, accent: '#7b2ff7' },
  { type: 'divider', label: 'divider-portal' },

  // ── Phase 2 — Portal content ──
  { link: '/admin/portal/testimonials', tKey: 'nav.testimonials',   icon: FormatQuoteIcon },
  { link: '/admin/portal/faq',          tKey: 'nav.faq',            icon: HelpOutlineIcon },
  { link: '/admin/portal/courses',      tKey: 'nav.coursePreviews', icon: MenuBookIcon    },
  { link: '/admin/portal/competition',  tKey: 'nav.competition',    icon: EmojiEventsIcon },
  { link: '/admin/portal/applications', tKey: 'nav.applications',   icon: HandshakeIcon   },
];

export default function Admin() {
  const { t } = useAppTranslation(['admin', 'common']);

  const navItems = NAV_CONFIG.map(({ tKey, ...rest }) =>
    tKey ? { ...rest, label: t(tKey) } : rest,
  );

  return (
    <AppShell
      navItems={navItems}
      drawerLabel={t('portal.label')}
      pageTitle={t('portal.pageTitle')}
    />
  );
}
