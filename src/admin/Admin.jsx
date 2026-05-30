/**
 * @file Admin.jsx
 * @description Admin / Director portal layout — thin wrapper around AppShell.
 * Accessible only to authenticated ADMIN and DIRECTOR roles.
 */

import DashboardIcon       from '@mui/icons-material/Dashboard';
import BusinessIcon        from '@mui/icons-material/Business';
import AddBusinessIcon     from '@mui/icons-material/AddBusiness';
import ManageAccountsIcon  from '@mui/icons-material/ManageAccounts';

import AppShell from '../components/AppShell';

const navItems = [
  { link: '/admin/dashboard',  label: 'Dashboard',     icon: DashboardIcon      },
  { link: '/admin/campuses',   label: 'Campuses',      icon: BusinessIcon       },
  { link: '/admin/new-campus', label: 'New Campus',    icon: AddBusinessIcon    },
  { link: '/admin/accounts',   label: 'Admin Accounts', icon: ManageAccountsIcon },
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
