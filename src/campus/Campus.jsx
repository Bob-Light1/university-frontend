/**
 * @file Campus.jsx
 * @description Campus Manager layout — thin wrapper around AppShell.
 *   All drawer / responsive logic lives in AppShell.
 *
 *   navItems uses the 'group' type to organise the 15 modules into 5
 *   collapsible sections, reducing visual density from 20 flat items to
 *   ~8 visible rows at any time.
 *
 *   `feature` carries the entitlement registry key of the module an entry
 *   opens; AppShell removes the entries this campus does not have and badges
 *   the ones a global role may still open (entitlement design doc §8.2).
 *   Entries with NO key are deliberately ungated: Home and Dashboard belong to
 *   no module, and Schedule / Attendance are served by `student` + `teacher`,
 *   both `core` — a key there would claim a single owner they do not have.
 */

import { useParams } from 'react-router-dom';

import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
import HomeIcon               from '@mui/icons-material/Home';
import CampaignIcon           from '@mui/icons-material/Campaign';
import MarkEmailReadIcon      from '@mui/icons-material/MarkEmailRead';
import DashboardCustomizeIcon from '@mui/icons-material/DashboardCustomize';
import GroupIcon              from '@mui/icons-material/Group';
import RecordVoiceOverIcon    from '@mui/icons-material/RecordVoiceOver';
import FamilyRestroomIcon     from '@mui/icons-material/FamilyRestroom';
import LibraryBooksIcon       from '@mui/icons-material/LibraryBooks';
import SubjectIcon            from '@mui/icons-material/Subject';
import ExplicitIcon           from '@mui/icons-material/Explicit';
import AssessmentIcon         from '@mui/icons-material/Assessment';
import EventNoteIcon          from '@mui/icons-material/EventNote';
import AutoAwesomeIcon        from '@mui/icons-material/AutoAwesome';
import ChecklistRtlIcon       from '@mui/icons-material/ChecklistRtl';
import MenuBookIcon           from '@mui/icons-material/MenuBook';
import DescriptionIcon        from '@mui/icons-material/Description';
import PrintIcon              from '@mui/icons-material/Print';
import HandshakeIcon          from '@mui/icons-material/Handshake';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import BadgeIcon              from '@mui/icons-material/Badge';
import PsychologyIcon         from '@mui/icons-material/Psychology';
import SettingsIcon           from '@mui/icons-material/Settings';
import AppShell  from '../components/AppShell';
import { useAuth } from '../hooks/useAuth';

export default function Campus() {
  const { campusId } = useParams();
  const { user }     = useAuth();

  const isAdminOrDirector = user?.role === 'ADMIN' || user?.role === 'DIRECTOR';

  const navItems = [
    // Back-link — ADMIN / DIRECTOR only
    ...(isAdminOrDirector ? [
      { link: '/admin/dashboard', label: 'Admin Portal', icon: AdminPanelSettingsIcon, accent: '#003285' },
      { type: 'divider', label: 'divider-admin-campus' },
    ] : []),

    // ── Always-visible top items ────────────────────────────────────────────
    { link: '/',                             label: 'Home',      icon: HomeIcon },
    { link: `/campus/${campusId}/dashboard`, label: 'Dashboard', icon: DashboardCustomizeIcon },

    { type: 'divider', label: 'divider-top' },

    // ── People — Students · Teachers · Parents ──────────────────────────────
    {
      type: 'group', label: 'People', icon: GroupIcon,
      items: [
        { link: `/campus/${campusId}/students`, label: 'Students', icon: GroupIcon,          feature: 'student' },
        { link: `/campus/${campusId}/teachers`, label: 'Teachers', icon: RecordVoiceOverIcon, feature: 'teacher' },
        { link: `/campus/${campusId}/parents`,  label: 'Parents',  icon: FamilyRestroomIcon,  feature: 'parent' },
      ],
    },

    // ── Academic — Classes · Subjects · Schedule · Attendance ───────────────
    {
      type: 'group', label: 'Academic', icon: LibraryBooksIcon,
      items: [
        { link: `/campus/${campusId}/classes`,       label: 'Classes',    icon: LibraryBooksIcon, feature: 'class' },
        { link: `/campus/${campusId}/subjects`,      label: 'Subjects',   icon: SubjectIcon,      feature: 'subject' },
        { link: `/campus/${campusId}/schedule`,      label: 'Schedule',   icon: EventNoteIcon },
        { link: `/campus/${campusId}/schedule-gaet`, label: 'GAET',       icon: AutoAwesomeIcon,  feature: 'gaet' },
        { link: `/campus/${campusId}/attendance`,    label: 'Attendance', icon: ChecklistRtlIcon },
      ],
    },

    // ── Evaluation — Examination · Results ─────────────────────────────────
    {
      type: 'group', label: 'Evaluation', icon: AssessmentIcon,
      items: [
        { link: `/campus/${campusId}/examination`, label: 'Examination', icon: ExplicitIcon,   feature: 'exam' },
        { link: `/campus/${campusId}/results`,     label: 'Results',     icon: AssessmentIcon, feature: 'result' },
      ],
    },

    // ── Resources — Courses · Documents · Print ─────────────────────────────
    {
      type: 'group', label: 'Resources', icon: MenuBookIcon,
      items: [
        { link: `/campus/${campusId}/courses`,   label: 'Courses',   icon: MenuBookIcon,    feature: 'course' },
        { link: `/campus/${campusId}/documents`, label: 'Documents', icon: DescriptionIcon, feature: 'document' },
        { link: `/campus/${campusId}/print`,     label: 'Print',     icon: PrintIcon,       feature: 'academic-print' },
      ],
    },

    // ── Business — Partners · Finance ───────────────────────────────────────
    {
      type: 'group', label: 'Business', icon: HandshakeIcon,
      items: [
        { link: `/campus/${campusId}/partners`, label: 'Partners', icon: HandshakeIcon,             feature: 'partner' },
        { link: `/campus/${campusId}/finance`,  label: 'Finance',  icon: AccountBalanceWalletIcon, feature: 'finance' },
      ],
    },

    // ── Personnel — Staff · Mentors ─────────────────────────────────────────
    {
      type: 'group', label: 'Personnel', icon: BadgeIcon,
      items: [
        { link: `/campus/${campusId}/staff`,   label: 'Staff',   icon: BadgeIcon,      feature: 'staff' },
        { link: `/campus/${campusId}/mentors`, label: 'Mentors', icon: PsychologyIcon, feature: 'mentor' },
      ],
    },

    // ── Announcements & notification delivery log ───────────────────────────
    // ── AI Assistant (Phase 3 — chat · search · analytics · advisors) ───────
    { type: 'divider', label: 'divider-ai' },
    { link: `/campus/${campusId}/ai`, label: 'AI Assistant', icon: AutoAwesomeIcon, accent: '#7b2ff7', feature: 'ai' },

    // ── Announcements & notification delivery log ───────────────────────────
    { type: 'divider', label: 'divider-announcements' },
    { link: `/campus/${campusId}/notification`,     label: 'Announcements', icon: CampaignIcon,      feature: 'announcement' },
    { link: `/campus/${campusId}/notification-log`, label: 'Delivery Log',  icon: MarkEmailReadIcon, feature: 'notification' },

    // ── Always-visible bottom item ──────────────────────────────────────────
    { type: 'divider', label: 'divider-settings' },
    { link: `/campus/${campusId}/settings`, label: 'Settings', icon: SettingsIcon, feature: 'settings' },
  ];

  return (
    <AppShell
      navItems={navItems}
      drawerLabel="Campus Manager"
      pageTitle="Campus Dashboard"
    />
  );
}
