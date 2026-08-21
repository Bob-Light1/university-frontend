/**
 * @file Student.jsx
 * @description Student layout — thin wrapper around AppShell.
 *
 * `feature` is the entitlement registry key of the module an entry opens.
 * AppShell removes the entries this campus does not have (design doc §8.2);
 * entries without a key belong to no single module (Home, Dashboard) or are
 * served by `core` ones (Schedule, Attendance → `student` / `teacher`).
 */

import HomeIcon               from '@mui/icons-material/Home';
import DashboardCustomizeIcon from '@mui/icons-material/DashboardCustomize';
import ExplicitIcon           from '@mui/icons-material/Explicit';
import AssessmentIcon         from '@mui/icons-material/Assessment';
import EventNoteIcon          from '@mui/icons-material/EventNote';
import ChecklistRtlIcon       from '@mui/icons-material/ChecklistRtl';
import MenuBookIcon           from '@mui/icons-material/MenuBook';
import DescriptionIcon        from '@mui/icons-material/Description';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';

import AppShell from '../components/AppShell';

const navItems = [
  { link: '/',                    label: 'Home',        icon: HomeIcon },
  { link: '/student',             label: 'Dashboard',   icon: DashboardCustomizeIcon },
  { link: '/student/examination', label: 'Examination', icon: ExplicitIcon,   feature: 'exam' },
  { link: '/student/results',     label: 'Results',     icon: AssessmentIcon, feature: 'result' },
  { link: '/student/schedule',    label: 'Schedule',    icon: EventNoteIcon },
  { link: '/student/attendance',  label: 'Attendance',  icon: ChecklistRtlIcon },
  { link: '/student/courses',     label: 'Courses',     icon: MenuBookIcon,   feature: 'course' },
  { link: '/student/documents',   label: 'Documents',   icon: DescriptionIcon, feature: 'document' },
  { link: '/student/finance',     label: 'Finance',     icon: AccountBalanceWalletIcon, feature: 'finance' },
];

export default function Student() {
  return (
    <AppShell
      navItems={navItems}
      drawerLabel="Student Portal"
      pageTitle="Student Dashboard"
    />
  );
}
