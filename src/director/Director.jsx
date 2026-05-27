/**
 * @file Director.jsx
 * @description Director portal layout — thin wrapper around AppShell.
 * Accessible only to authenticated DIRECTOR role.
 */

import DashboardIcon  from '@mui/icons-material/Dashboard';
import BusinessIcon   from '@mui/icons-material/Business';
import PersonIcon     from '@mui/icons-material/Person';

import AppShell from '../components/AppShell';

const navItems = [
  { link: '/director/dashboard', label: 'Dashboard', icon: DashboardIcon },
  { link: '/director/campuses',  label: 'Campuses',  icon: BusinessIcon  },
  { link: '/director/profile',   label: 'My Profile', icon: PersonIcon   },
];

export default function Director() {
  return (
    <AppShell
      navItems={navItems}
      drawerLabel="Director Portal"
      pageTitle="Director Portal"
    />
  );
}
