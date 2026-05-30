/**
 * @file Student.jsx
 * @description Student layout — thin wrapper around AppShell.
 */

import HomeIcon               from '@mui/icons-material/Home';
import DashboardCustomizeIcon from '@mui/icons-material/DashboardCustomize';
import ExplicitIcon           from '@mui/icons-material/Explicit';
import AssessmentIcon         from '@mui/icons-material/Assessment';
import EventNoteIcon          from '@mui/icons-material/EventNote';
import ChecklistRtlIcon       from '@mui/icons-material/ChecklistRtl';
import MenuBookIcon           from '@mui/icons-material/MenuBook';
import DescriptionIcon        from '@mui/icons-material/Description';

import AppShell from '../components/AppShell';

const navItems = [
  { link: '/',                    label: 'Home',        icon: HomeIcon },
  { link: '/student',             label: 'Dashboard',   icon: DashboardCustomizeIcon },
  { link: '/student/examination', label: 'Examination', icon: ExplicitIcon },
  { link: '/student/results',     label: 'Results',     icon: AssessmentIcon },
  { link: '/student/schedule',    label: 'Schedule',    icon: EventNoteIcon },
  { link: '/student/attendance',  label: 'Attendance',  icon: ChecklistRtlIcon },
  { link: '/student/courses',     label: 'Courses',     icon: MenuBookIcon },
  { link: '/student/documents',   label: 'Documents',   icon: DescriptionIcon },
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
