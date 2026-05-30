/**
 * @file Staff.jsx
 * @description Staff portal layout — dynamic navigation based on permissions.
 *
 * Nav items are computed at render time from user.permissions (injected at
 * login from the assigned StaffRole). Each permission key maps to a module.
 */

import HomeIcon        from '@mui/icons-material/Home';
import DashboardIcon   from '@mui/icons-material/DashboardCustomize';
import GroupIcon       from '@mui/icons-material/Group';
import ChecklistIcon   from '@mui/icons-material/ChecklistRtl';
import AssessmentIcon  from '@mui/icons-material/Assessment';
import QuizIcon        from '@mui/icons-material/Quiz';
import MenuBookIcon    from '@mui/icons-material/MenuBook';
import EventNoteIcon   from '@mui/icons-material/EventNote';
import DescriptionIcon from '@mui/icons-material/Description';
import PrintIcon       from '@mui/icons-material/Print';
import RecordVoiceOverIcon from '@mui/icons-material/RecordVoiceOver';
import CampaignIcon    from '@mui/icons-material/Campaign';
import MessageIcon     from '@mui/icons-material/Message';
import AccountBalanceIcon from '@mui/icons-material/AccountBalance';

import AppShell  from '../components/AppShell';
import { useAuth } from '../hooks/useAuth';

// Map permission keys → nav item definition
const PERMISSION_NAV = [
  { keys: ['students.read',     'students.manage'],     link: '/staff/students',   label: 'Students',     icon: GroupIcon         },
  { keys: ['teachers.read',     'teachers.manage'],     link: '/staff/teachers',   label: 'Teachers',     icon: RecordVoiceOverIcon },
  { keys: ['attendance.read',   'attendance.manage'],   link: '/staff/attendance', label: 'Attendance',   icon: ChecklistIcon     },
  { keys: ['results.read',      'results.manage'],      link: '/staff/results',    label: 'Results',      icon: AssessmentIcon    },
  { keys: ['courses.read',      'courses.manage'],      link: '/staff/courses',    label: 'Courses',      icon: MenuBookIcon      },
  { keys: ['schedule.read',     'schedule.manage'],     link: '/staff/schedule',   label: 'Schedule',     icon: EventNoteIcon     },
  { keys: ['documents.read',    'documents.manage'],    link: '/staff/documents',  label: 'Documents',    icon: DescriptionIcon   },
  { keys: ['finance.read',      'finance.manage'],      link: '/staff/finance',    label: 'Finance',      icon: AccountBalanceIcon },
  { keys: ['examinations.read', 'examinations.manage'], link: '/staff/exams',      label: 'Examinations', icon: QuizIcon          },
  { keys: ['print'],                                    link: '/staff/print',      label: 'Print',        icon: PrintIcon         },
  { keys: ['announcements'],                            link: '/staff/announcements', label: 'Announcements', icon: CampaignIcon   },
  { keys: ['messages'],                                 link: '/staff/messages',   label: 'Messages',     icon: MessageIcon       },
];

export default function Staff() {
  const { user } = useAuth();
  const perms    = user?.permissions ?? [];

  const dynamicItems = PERMISSION_NAV
    .filter(({ keys }) => keys.some((k) => perms.includes(k)))
    .map(({ link, label, icon }) => ({ link, label, icon }));

  const navItems = [
    { link: '/',      label: 'Home',      icon: HomeIcon      },
    { link: '/staff', label: 'Dashboard', icon: DashboardIcon },
    ...dynamicItems,
  ];

  return (
    <AppShell
      navItems={navItems}
      drawerLabel="Staff Portal"
      pageTitle="Staff Dashboard"
    />
  );
}
