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
import { useAppTranslation } from '../hooks/useAppTranslation';

// Map permission keys → nav item definition (labels resolved at render via t())
const PERMISSION_NAV_CONFIG = [
  { keys: ['students.read',     'students.manage'],     link: '/staff/students',      tKey: 'common:nav.students',     icon: GroupIcon          },
  { keys: ['teachers.read',     'teachers.manage'],     link: '/staff/teachers',      tKey: 'common:nav.teachers',     icon: RecordVoiceOverIcon },
  { keys: ['attendance.read',   'attendance.manage'],   link: '/staff/attendance',    tKey: 'common:nav.attendance',   icon: ChecklistIcon      },
  { keys: ['results.read',      'results.manage'],      link: '/staff/results',       tKey: 'common:nav.results',      icon: AssessmentIcon     },
  { keys: ['courses.read',      'courses.manage'],      link: '/staff/courses',       tKey: 'common:nav.courses',      icon: MenuBookIcon       },
  { keys: ['schedule.read',     'schedule.manage'],     link: '/staff/schedule',      tKey: 'common:nav.schedule',     icon: EventNoteIcon      },
  { keys: ['documents.read',    'documents.manage'],    link: '/staff/documents',     tKey: 'common:nav.documents',    icon: DescriptionIcon    },
  { keys: ['finance.read',      'finance.manage'],      link: '/staff/finance',       tKey: 'common:nav.finance',      icon: AccountBalanceIcon },
  { keys: ['examinations.read', 'examinations.manage'], link: '/staff/exams',         tKey: 'common:nav.examinations', icon: QuizIcon           },
  { keys: ['print'],                                    link: '/staff/print',         tKey: 'common:nav.print',        icon: PrintIcon          },
  { keys: ['announcements'],                            link: '/staff/announcements', tKey: 'common:nav.announcements',icon: CampaignIcon       },
  { keys: ['messages'],                                 link: '/staff/messages',      tKey: 'common:nav.messages',     icon: MessageIcon        },
];

export default function Staff() {
  const { user } = useAuth();
  const { t }    = useAppTranslation(['staff', 'common']);
  const perms    = user?.permissions ?? [];

  const dynamicItems = PERMISSION_NAV_CONFIG
    .filter(({ keys }) => keys.some((k) => perms.includes(k)))
    .map(({ link, tKey, icon }) => ({ link, label: t(tKey), icon }));

  const navItems = [
    { link: '/',      label: t('common:nav.home'),      icon: HomeIcon      },
    { link: '/staff', label: t('common:nav.dashboard'), icon: DashboardIcon },
    ...dynamicItems,
  ];

  return (
    <AppShell
      navItems={navItems}
      drawerLabel={t('staff:portal.label')}
      pageTitle={t('staff:portal.pageTitle')}
    />
  );
}
