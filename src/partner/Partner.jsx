/**
 * @file Partner.jsx
 * @description Partner layout — thin wrapper around AppShell.
 */

import HomeIcon                from '@mui/icons-material/Home';
import DashboardIcon           from '@mui/icons-material/Dashboard';
import QrCode2Icon             from '@mui/icons-material/QrCode2';
import PeopleIcon              from '@mui/icons-material/People';
import AttachMoneyIcon         from '@mui/icons-material/AttachMoney';
import NotificationsActiveIcon from '@mui/icons-material/NotificationsActive';

import AppShell from '../components/AppShell';

const navItems = [
  { link: '/',                     label: 'Home',          icon: HomeIcon },
  { link: '/partner',              label: 'Dashboard',     icon: DashboardIcon },
  { link: '/partner/kit',          label: 'Affiliate Kit', icon: QrCode2Icon },
  { link: '/partner/leads',        label: 'My Leads',      icon: PeopleIcon },
  { link: '/partner/commissions',  label: 'Commissions',   icon: AttachMoneyIcon },
  { link: '/partner/notification', label: 'Notifications', icon: NotificationsActiveIcon },
];

export default function Partner() {
  return (
    <AppShell
      navItems={navItems}
      drawerLabel="Partner Portal"
      pageTitle="Partner Portal"
    />
  );
}
