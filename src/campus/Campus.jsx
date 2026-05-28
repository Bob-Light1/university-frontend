/**
 * @file Campus.jsx
 * @description Campus Manager layout — thin wrapper around AppShell.
 *   All drawer / responsive logic lives in AppShell.
 */

import { useParams } from 'react-router-dom';

import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
import HomeIcon               from '@mui/icons-material/Home';
import DashboardCustomizeIcon from '@mui/icons-material/DashboardCustomize';
import GroupIcon              from '@mui/icons-material/Group';
import RecordVoiceOverIcon    from '@mui/icons-material/RecordVoiceOver';
import FamilyRestroomIcon     from '@mui/icons-material/FamilyRestroom';
import LibraryBooksIcon       from '@mui/icons-material/LibraryBooks';
import SubjectIcon            from '@mui/icons-material/Subject';
import ExplicitIcon           from '@mui/icons-material/Explicit';
import AssessmentIcon         from '@mui/icons-material/Assessment';
import EventNoteIcon          from '@mui/icons-material/EventNote';
import ChecklistRtlIcon       from '@mui/icons-material/ChecklistRtl';
import MenuBookIcon           from '@mui/icons-material/MenuBook';
import DescriptionIcon        from '@mui/icons-material/Description';
import PrintIcon              from '@mui/icons-material/Print';
import HandshakeIcon          from '@mui/icons-material/Handshake';
import BadgeIcon              from '@mui/icons-material/Badge';
import PsychologyIcon         from '@mui/icons-material/Psychology';
import SettingsIcon           from '@mui/icons-material/Settings';

import AppShell   from '../components/AppShell';
import { useAuth } from '../hooks/useAuth';

export default function Campus() {
  const { campusId } = useParams();
  const { user }     = useAuth();

  const isAdminOrDirector = user?.role === 'ADMIN' || user?.role === 'DIRECTOR';

  const navItems = [
    // Back-link visible only for ADMIN / DIRECTOR — not for CAMPUS_MANAGER
    ...(isAdminOrDirector ? [
      {
        link:   '/admin/dashboard',
        label:  'Admin Portal',
        icon:   AdminPanelSettingsIcon,
        accent: '#003285',
      },
      { type: 'divider', label: 'divider-admin-campus' },
    ] : []),
    { link: '/',                                      label: 'Home',        icon: HomeIcon },
    { link: `/campus/${campusId}/dashboard`,          label: 'Dashboard',   icon: DashboardCustomizeIcon },
    { link: `/campus/${campusId}/students`,           label: 'Students',    icon: GroupIcon },
    { link: `/campus/${campusId}/teachers`,           label: 'Teachers',    icon: RecordVoiceOverIcon },
    { link: `/campus/${campusId}/parents`,            label: 'Parents',     icon: FamilyRestroomIcon },
    { link: `/campus/${campusId}/classes`,            label: 'Classes',     icon: LibraryBooksIcon },
    { link: `/campus/${campusId}/subjects`,           label: 'Subjects',    icon: SubjectIcon },
    { link: `/campus/${campusId}/examination`,        label: 'Examination', icon: ExplicitIcon },
    { link: `/campus/${campusId}/results`,            label: 'Results',     icon: AssessmentIcon },
    { link: `/campus/${campusId}/schedule`,           label: 'Schedule',    icon: EventNoteIcon },
    { link: `/campus/${campusId}/attendance`,         label: 'Attendance',  icon: ChecklistRtlIcon },
    { link: `/campus/${campusId}/courses`,            label: 'Courses',     icon: MenuBookIcon },
    { link: `/campus/${campusId}/documents`,          label: 'Documents',   icon: DescriptionIcon },
    { link: `/campus/${campusId}/print`,              label: 'Print',       icon: PrintIcon },
    { link: `/campus/${campusId}/partners`,           label: 'Partners',    icon: HandshakeIcon },
    { type: 'divider', label: 'divider-personnel' },
    { link: `/campus/${campusId}/staff`,              label: 'Staff',       icon: BadgeIcon },
    { link: `/campus/${campusId}/mentors`,            label: 'Mentors',     icon: PsychologyIcon },
    { type: 'divider', label: 'divider-settings' },
    { link: `/campus/${campusId}/settings`,           label: 'Settings',    icon: SettingsIcon },
  ];

  return (
    <AppShell
      navItems={navItems}
      drawerLabel="Campus Manager"
      pageTitle="Campus Dashboard"
    />
  );
}
