/**
 * @file Mentor.jsx
 * @description Mentor portal layout — thin wrapper around AppShell.
 */

import HomeIcon        from '@mui/icons-material/Home';
import DashboardIcon   from '@mui/icons-material/DashboardCustomize';
import GroupIcon       from '@mui/icons-material/Group';
import AssessmentIcon  from '@mui/icons-material/Assessment';
import ChecklistIcon   from '@mui/icons-material/ChecklistRtl';
import MenuBookIcon    from '@mui/icons-material/MenuBook';
import PersonIcon      from '@mui/icons-material/Person';

import AppShell from '../components/AppShell';

const navItems = [
  { link: '/',                    label: 'Home',       icon: HomeIcon },
  { link: '/mentor',              label: 'Dashboard',  icon: DashboardIcon },
  { link: '/mentor/students',     label: 'My Students', icon: GroupIcon },
  { link: '/mentor/results',      label: 'Results',    icon: AssessmentIcon },
  { link: '/mentor/attendance',   label: 'Attendance', icon: ChecklistIcon },
  { link: '/mentor/courses',      label: 'Courses',    icon: MenuBookIcon },
  { link: '/mentor/profile',      label: 'My Profile', icon: PersonIcon },
];

export default function Mentor() {
  return (
    <AppShell
      navItems={navItems}
      drawerLabel="Mentor Portal"
      pageTitle="Mentor Dashboard"
    />
  );
}
