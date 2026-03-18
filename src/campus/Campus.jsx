/**
 * @file Campus.jsx
 * @description Campus Manager layout shell.
 *   Wraps all campus-scoped routes with a mini/full side drawer
 *   and the shared AppNavBar.
 *
 * Isolation: campusId is read from URL params and forwarded to every
 * child route via React Router's <Outlet />.
 */

import * as React from 'react';
import { Suspense }                    from 'react';
import { styled, useTheme }            from '@mui/material/styles';
import Box                             from '@mui/material/Box';
import MuiDrawer                       from '@mui/material/Drawer';
import Toolbar                         from '@mui/material/Toolbar';
import List                            from '@mui/material/List';
import CssBaseline                     from '@mui/material/CssBaseline';
import Divider                         from '@mui/material/Divider';
import IconButton                      from '@mui/material/IconButton';
import ListItem                        from '@mui/material/ListItem';
import ListItemButton                  from '@mui/material/ListItemButton';
import ListItemIcon                    from '@mui/material/ListItemIcon';
import ListItemText                    from '@mui/material/ListItemText';
import Tooltip                         from '@mui/material/Tooltip';
import Typography                      from '@mui/material/Typography';
import { Outlet, useNavigate, useParams, useLocation } from 'react-router-dom';

import ChevronLeftIcon  from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';

// ── Nav icons ──────────────────────────────────────────────────────────────
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
import NotificationsActiveIcon from '@mui/icons-material/NotificationsActive';

import AppNavBar, { StyledAppBar } from '../components/AppNavBar';
import Loader                      from '../components/Loader';

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

export default function Campus() {
  const { campusId }   = useParams();
  const theme          = useTheme();
  const location       = useLocation();
  const navigate       = useNavigate();
  const [open, setOpen] = React.useState(false);

  // ── Navigation items scoped to this campus ──────────────────────────────
  const navItems = [
    { link: '/',                                      label: 'Home',         icon: HomeIcon },
    { link: `/campus/${campusId}/dashboard`,          label: 'Dashboard',    icon: DashboardCustomizeIcon },
    { link: `/campus/${campusId}/students`,           label: 'Students',     icon: GroupIcon },
    { link: `/campus/${campusId}/teachers`,           label: 'Teachers',     icon: RecordVoiceOverIcon },
    { link: `/campus/${campusId}/parents`,            label: 'Parents',      icon: FamilyRestroomIcon },
    { link: `/campus/${campusId}/classes`,            label: 'Classes',      icon: LibraryBooksIcon },
    { link: `/campus/${campusId}/subjects`,           label: 'Subjects',     icon: SubjectIcon },
    { link: `/campus/${campusId}/examination`,        label: 'Examination',  icon: ExplicitIcon },
    { link: `/campus/${campusId}/results`,            label: 'Results',      icon: AssessmentIcon },
    { link: `/campus/${campusId}/schedule`,           label: 'Schedule',     icon: EventNoteIcon },
    { link: `/campus/${campusId}/attendance`,         label: 'Attendance',   icon: ChecklistRtlIcon },
    { link: `/campus/${campusId}/courses`,            label: 'Courses',      icon: MenuBookIcon },
    { link: `/campus/${campusId}/documents`,          label: 'Documents',    icon: DescriptionIcon },
  ];

  return (
    <Box sx={{ display: 'flex' }}>
      <CssBaseline />

      {/* ── Shared top bar ── */}
      <AppNavBar
        drawerOpen={open}
        onDrawerOpen={() => setOpen(true)}
        pageTitle="Campus Dashboard"
      />

      {/* ── Side drawer ── */}
      <Drawer variant="permanent" open={open}>
        <DrawerHeader>
          {/* Brand / logo area when drawer is expanded */}
          {open && (
            <Typography
              variant="caption"
              fontWeight={700}
              color="primary"
              sx={{ flexGrow: 1, pl: 1, letterSpacing: '0.08em', textTransform: 'uppercase' }}
            >
              Campus Manager
            </Typography>
          )}
          <IconButton onClick={() => setOpen(false)} aria-label="close drawer">
            {theme.direction === 'rtl' ? <ChevronRightIcon /> : <ChevronLeftIcon />}
          </IconButton>
        </DrawerHeader>

        <Divider />

        <List>
          {navItems.map((item) => {
            const isActive = location.pathname === item.link;
            return (
              <ListItem key={item.link} disablePadding sx={{ display: 'block' }}>
                <Tooltip title={open ? '' : item.label} placement="right">
                  <ListItemButton
                    onClick={() => navigate(item.link)}
                    selected={isActive}
                    sx={[
                      { minHeight: 48, px: 2.5 },
                      open ? { justifyContent: 'initial' } : { justifyContent: 'center' },
                      isActive && {
                        bgcolor: 'rgba(73,137,200,0.12)',
                        borderRight: '3px solid',
                        borderColor: 'primary.main',
                      },
                    ]}
                  >
                    <ListItemIcon
                      sx={[
                        { minWidth: 0, justifyContent: 'center', color: isActive ? 'primary.main' : 'inherit' },
                        open ? { mr: 3 } : { mr: 'auto' },
                      ]}
                    >
                      <item.icon fontSize="small" />
                    </ListItemIcon>
                    <ListItemText
                      primary={item.label}
                      primaryTypographyProps={{ fontSize: '0.875rem', fontWeight: isActive ? 600 : 400 }}
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

      {/* ── Main content ── */}
      <Box component="main" sx={{ flexGrow: 1, minHeight: '100vh' }}>
        <DrawerHeader />
        <Suspense fallback={<Loader />}>
          <Outlet />
        </Suspense>
      </Box>
    </Box>
  );
}