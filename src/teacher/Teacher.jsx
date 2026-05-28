/**
 * @file Teacher.jsx
 * @description Teacher layout — thin wrapper around AppShell.
 */

import HomeIcon               from '@mui/icons-material/Home';
import DashboardCustomizeIcon from '@mui/icons-material/DashboardCustomize';
import ExplicitIcon           from '@mui/icons-material/Explicit';
import AssessmentIcon         from '@mui/icons-material/Assessment';
import EventNoteIcon          from '@mui/icons-material/EventNote';
import ChecklistRtlIcon       from '@mui/icons-material/ChecklistRtl';
import MenuBookIcon           from '@mui/icons-material/MenuBook';
import DescriptionIcon        from '@mui/icons-material/Description';
import PersonIcon             from '@mui/icons-material/Person';

import AppShell from '../components/AppShell';

const navItems = [
  { link: '/',                    label: 'Home',        icon: HomeIcon },
  { link: '/teacher',             label: 'Dashboard',  icon: DashboardCustomizeIcon },
  { link: '/teacher/examination', label: 'Examination', icon: ExplicitIcon },
  { link: '/teacher/results',     label: 'Results',     icon: AssessmentIcon },
  { link: '/teacher/schedule',    label: 'Schedule',    icon: EventNoteIcon },
  { link: '/teacher/attendance',  label: 'Attendance',  icon: ChecklistRtlIcon },
  { link: '/teacher/courses',     label: 'Courses',     icon: MenuBookIcon },
  { link: '/teacher/documents',   label: 'Documents',   icon: DescriptionIcon },
  { link: '/teacher/profile',     label: 'My Profile',  icon: PersonIcon },
];

export default function Teacher() {
  return (
    <AppShell
      navItems={navItems}
      drawerLabel="Teacher Portal"
      pageTitle="Teacher Dashboard"
    />
  );
}
