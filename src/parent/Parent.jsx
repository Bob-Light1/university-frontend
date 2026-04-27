/**
 * @file Parent.jsx
 * @description Parent layout — fetches first child then delegates to AppShell.
 */

import { useState, useEffect } from 'react';

import HomeIcon               from '@mui/icons-material/Home';
import DashboardCustomizeIcon from '@mui/icons-material/DashboardCustomize';
import AccountCircleIcon      from '@mui/icons-material/AccountCircle';
import TrendingUpIcon         from '@mui/icons-material/TrendingUp';
import AccessTimeIcon         from '@mui/icons-material/AccessTime';
import EventNoteIcon          from '@mui/icons-material/EventNote';
import DescriptionIcon        from '@mui/icons-material/Description';

import AppShell          from '../components/AppShell';
import { useAuth }       from '../hooks/useAuth';
import { getMyChildren } from '../services/parent.service';

export default function Parent() {
  const { user } = useAuth();

  // Seed from the auth token immediately — avoids a blank nav on first render.
  // The useEffect below updates with the fully-populated list once it resolves.
  const [firstChildId, setFirstChildId] = useState(() => {
    const ids = user?.children;
    return Array.isArray(ids) && ids.length > 0 ? String(ids[0]) : null;
  });

  useEffect(() => {
    getMyChildren()
      .then(({ data }) => {
        // Filter out nulls in case a referenced student was deleted.
        const children = (data.data?.children ?? []).filter(Boolean);
        if (children.length > 0) setFirstChildId(String(children[0]._id));
      })
      .catch((err) => {
        console.warn('[Parent] Could not refresh children for nav:', err?.response?.data?.message ?? err.message);
      });
  }, []);

  // Returns null when no child is known yet — AppShell treats null link as
  // non-navigable (isActive=false, click blocked) regardless of disabled state.
  const childLink = (section) =>
    firstChildId ? `/parent/children/${firstChildId}/${section}` : null;

  const navItems = [
    { link: '/',                     label: 'Home',       icon: HomeIcon,               disabled: false },
    { link: '/parent',               label: 'Dashboard',  icon: DashboardCustomizeIcon, disabled: false },
    { link: '/parent/profile',       label: 'My Profile', icon: AccountCircleIcon,      disabled: false },
    { link: childLink('results'),    label: 'Results',    icon: TrendingUpIcon,         disabled: !firstChildId },
    { link: childLink('attendance'), label: 'Attendance', icon: AccessTimeIcon,         disabled: !firstChildId },
    { link: childLink('schedule'),   label: 'Schedule',   icon: EventNoteIcon,          disabled: !firstChildId },
    { link: childLink('transcripts'),label: 'Transcripts',icon: DescriptionIcon,        disabled: !firstChildId },
  ];

  return (
    <AppShell
      navItems={navItems}
      drawerLabel="Parent Portal"
      pageTitle="Parent Dashboard"
    />
  );
}
