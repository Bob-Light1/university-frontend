/**
 * @file Parent.jsx
 * @description Parent layout shell.
 *   Wraps all parent-scoped routes with a mini/full side drawer
 *   and the shared AppNavBar.
 */

import * as React from 'react';
import { Suspense, useState, useEffect } from 'react';
import { styled, useTheme } from '@mui/material/styles';
import Box                  from '@mui/material/Box';
import MuiDrawer            from '@mui/material/Drawer';
import List                 from '@mui/material/List';
import CssBaseline          from '@mui/material/CssBaseline';
import Divider              from '@mui/material/Divider';
import IconButton           from '@mui/material/IconButton';
import ListItem             from '@mui/material/ListItem';
import ListItemButton       from '@mui/material/ListItemButton';
import ListItemIcon         from '@mui/material/ListItemIcon';
import ListItemText         from '@mui/material/ListItemText';
import Tooltip              from '@mui/material/Tooltip';
import Typography           from '@mui/material/Typography';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';

import ChevronLeftIcon  from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';

// ── Nav icons ──────────────────────────────────────────────────────────────
import HomeIcon               from '@mui/icons-material/Home';
import DashboardCustomizeIcon from '@mui/icons-material/DashboardCustomize';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import ChildCareIcon     from '@mui/icons-material/ChildCare';
import TrendingUpIcon    from '@mui/icons-material/TrendingUp';
import AccessTimeIcon    from '@mui/icons-material/AccessTime';
import EventNoteIcon     from '@mui/icons-material/EventNote';
import DescriptionIcon   from '@mui/icons-material/Description';

import AppNavBar from '../components/AppNavBar';
import Loader    from '../components/Loader';
import { getMyChildren } from '../services/parent.service';

// ─── Drawer layout constants ──────────────────────────────────────────────────

const drawerWidth = 240;

const openedMixin = (theme) => ({
  width: drawerWidth,
  transition: theme.transitions.create('width', {
    easing: theme.transitions.easing.sharp,
    duration: theme.transitions.duration.enteringScreen,
  }),
  overflowX: 'hidden',
});

const closedMixin = (theme) => ({
  transition: theme.transitions.create('width', {
    easing: theme.transitions.easing.sharp,
    duration: theme.transitions.duration.leavingScreen,
  }),
  overflowX: 'hidden',
  width: `calc(${theme.spacing(7)} + 1px)`,
  [theme.breakpoints.up('sm')]: {
    width: `calc(${theme.spacing(8)} + 1px)`,
  },
});

const DrawerHeader = styled('div')(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'flex-end',
  padding: theme.spacing(0, 1),
  ...theme.mixins.toolbar,
}));

const Drawer = styled(MuiDrawer, { shouldForwardProp: (prop) => prop !== 'open' })(
  ({ theme }) => ({
    width: drawerWidth,
    flexShrink: 0,
    whiteSpace: 'nowrap',
    boxSizing: 'border-box',
    variants: [
      {
        props: ({ open }) => open,
        style: {
          ...openedMixin(theme),
          '& .MuiDrawer-paper': openedMixin(theme),
        },
      },
      {
        props: ({ open }) => !open,
        style: {
          ...closedMixin(theme),
          '& .MuiDrawer-paper': closedMixin(theme),
        },
      },
    ],
  }),
);

// ─── Component ────────────────────────────────────────────────────────────────

export default function Parent() {
  const theme    = useTheme();
  const location = useLocation();
  const navigate = useNavigate();
  const [open, setOpen]         = React.useState(false);
  const [firstChildId, setFirstChildId] = useState(null);

  useEffect(() => {
    getMyChildren()
      .then(({ data }) => {
        const children = data.data?.children ?? [];
        if (children.length > 0) setFirstChildId(children[0]._id);
      })
      .catch(() => {});
  }, []);

  // Child-scoped links resolve to the first child's page, or fall back to dashboard
  const childLink = (section) =>
    firstChildId ? `/parent/children/${firstChildId}/${section}` : '/parent';

  const navItems = [
    { link: '/',                    label: 'Home',        icon: HomeIcon,               disabled: false },
    { link: '/parent',              label: 'Dashboard',   icon: DashboardCustomizeIcon, disabled: false },
    { link: '/parent/profile',      label: 'My Profile',  icon: AccountCircleIcon,      disabled: false },
    { link: childLink('results'),   label: 'Results',     icon: TrendingUpIcon,         disabled: !firstChildId },
    { link: childLink('attendance'),label: 'Attendance',  icon: AccessTimeIcon,         disabled: !firstChildId },
    { link: childLink('schedule'),  label: 'Schedule',    icon: EventNoteIcon,          disabled: !firstChildId },
    { link: childLink('transcripts'),label:'Transcripts', icon: DescriptionIcon,        disabled: !firstChildId },
  ];

  return (
    <Box sx={{ display: 'flex' }}>
      <CssBaseline />

      <AppNavBar
        drawerOpen={open}
        onDrawerOpen={() => setOpen(true)}
        pageTitle="Parent Dashboard"
      />

      <Drawer variant="permanent" open={open}>
        <DrawerHeader>
          {open && (
            <Typography
              variant="caption"
              fontWeight={700}
              color="primary"
              sx={{ flexGrow: 1, pl: 1, letterSpacing: '0.08em', textTransform: 'uppercase' }}
            >
              Parent Portal
            </Typography>
          )}
          <IconButton onClick={() => setOpen(false)} aria-label="close drawer">
            {theme.direction === 'rtl' ? <ChevronRightIcon /> : <ChevronLeftIcon />}
          </IconButton>
        </DrawerHeader>

        <Divider />

        <List>
          {navItems.map((item) => {
            const isActive = location.pathname.startsWith(item.link) && item.link !== '/';
            const exactActive = item.link === '/' ? location.pathname === '/' : isActive;
            return (
              <ListItem key={item.label} disablePadding sx={{ display: 'block' }}>
                <Tooltip title={open ? '' : item.label} placement="right">
                  <ListItemButton
                    onClick={() => !item.disabled && navigate(item.link)}
                    selected={exactActive}
                    disabled={item.disabled}
                    sx={[
                      { minHeight: 48, px: 2.5 },
                      open ? { justifyContent: 'initial' } : { justifyContent: 'center' },
                      exactActive && {
                        bgcolor: 'rgba(73,137,200,0.12)',
                        borderRight: '3px solid',
                        borderColor: 'primary.main',
                      },
                    ]}
                  >
                    <ListItemIcon
                      sx={[
                        { minWidth: 0, justifyContent: 'center', color: exactActive ? 'primary.main' : 'inherit' },
                        open ? { mr: 3 } : { mr: 'auto' },
                      ]}
                    >
                      <item.icon fontSize="small" />
                    </ListItemIcon>
                    <ListItemText
                      primary={item.label}
                      slotProps={{
                        primary: { fontSize: '0.875rem', fontWeight: exactActive ? 600 : 400 },
                      }}
                      sx={[open ? { opacity: 1 } : { opacity: 0 }]}
                    />
                  </ListItemButton>
                </Tooltip>
              </ListItem>
            );
          })}
        </List>

        <Divider />
      </Drawer>

      <Box component="main" sx={{ flexGrow: 1, minHeight: '100vh' }}>
        <DrawerHeader />
        <Suspense fallback={<Loader />}>
          <Outlet />
        </Suspense>
      </Box>
    </Box>
  );
}