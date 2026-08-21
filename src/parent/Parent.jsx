/**
 * @file Parent.jsx
 * @description Parent layout — fetches first child then delegates to AppShell.
 *
 * `feature` is the entitlement registry key AppShell filters on (design doc
 * §8.2). Note that these screens READ through the parent facade
 * (`/api/parents/me/children/...`), so the server gate on `/api/results` never
 * fires for them: the key here states which module OWNS the data, which is what
 * decides whether a parent should be offered it at all. A campus that hides
 * Results hides its children's results from parents too — that is the point of
 * §4.1.2, not a side effect.
 */

import { useState, useEffect } from 'react';

import HomeIcon               from '@mui/icons-material/Home';
import DashboardCustomizeIcon from '@mui/icons-material/DashboardCustomize';
import TrendingUpIcon         from '@mui/icons-material/TrendingUp';
import AccessTimeIcon         from '@mui/icons-material/AccessTime';
import EventNoteIcon          from '@mui/icons-material/EventNote';
import DescriptionIcon        from '@mui/icons-material/Description';

import AppShell          from '../components/AppShell';
import { useAuth }       from '../hooks/useAuth';
import { getMyChildren } from '../services/parentService';

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
    { link: childLink('results'),    label: 'Results',    icon: TrendingUpIcon,         disabled: !firstChildId, feature: 'result' },
    { link: childLink('attendance'), label: 'Attendance', icon: AccessTimeIcon,         disabled: !firstChildId },
    { link: childLink('schedule'),   label: 'Schedule',   icon: EventNoteIcon,          disabled: !firstChildId },
    { link: childLink('transcripts'),label: 'Transcripts',icon: DescriptionIcon,        disabled: !firstChildId, feature: 'result' },
  ];

  return (
    <AppShell
      navItems={navItems}
      drawerLabel="Parent Portal"
      pageTitle="Parent Dashboard"
    />
  );
}
