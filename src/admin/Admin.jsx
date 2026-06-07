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

import AppShell from '../components/AppShell';

const navItems = [
  { link: '/admin/dashboard',      label: 'Dashboard',      icon: DashboardIcon      },
  { link: '/admin/campuses',       label: 'Campuses',       icon: BusinessIcon       },
  { link: '/admin/new-campus',     label: 'New Campus',     icon: AddBusinessIcon    },
  { link: '/admin/accounts',       label: 'Admin Accounts', icon: ManageAccountsIcon },
  { link: '/admin/announcements',  label: 'Announcements',  icon: CampaignIcon       },
  // ── Phase 2 — Portal content ──
  { link: '/admin/portal/testimonials', label: 'Testimonials',    icon: FormatQuoteIcon },
  { link: '/admin/portal/faq',          label: 'FAQ',             icon: HelpOutlineIcon },
  { link: '/admin/portal/courses',      label: 'Course Previews', icon: MenuBookIcon    },
  { link: '/admin/portal/competition',  label: 'Competition',     icon: EmojiEventsIcon },
  { link: '/admin/portal/applications', label: 'Applications',    icon: HandshakeIcon   },
];

export default function Admin() {
  return (
    <AppShell
      navItems={navItems}
      drawerLabel="Admin Portal"
      pageTitle="Admin Portal"
    />
  );
}
