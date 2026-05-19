/**
 * @file AppShell.jsx
 * @description Shared responsive layout shell used by every authenticated role
 *   (Campus, Teacher, Student, Parent, Partner).
 *
 * Responsive behaviour:
 *   < md  (mobile / tablet) → Temporary overlay drawer.
 *                              Opens via the hamburger in AppNavBar.
 *                              Closes on navigation or backdrop tap.
 *   ≥ md  (desktop)         → Permanent mini drawer (icons only by default).
 *                              Expands to full 240 px on hamburger click,
 *                              collapses via the chevron inside the drawer.
 *                              AppBar shifts right when the drawer is expanded.
 *
 * Props:
 *  @prop {Array}  navItems     – Array of { link, label, icon, disabled? }
 *  @prop {string} drawerLabel  – Short brand label shown inside the open drawer
 *  @prop {string} pageTitle    – Forwarded to AppNavBar
 *  @prop {node}   [children]   – Alternative to <Outlet /> (optional)
 */

import { useState, Suspense } from 'react';
import { styled, useTheme }   from '@mui/material/styles';
import {
  Box,
  Drawer as MuiDrawer,
  List,
  CssBaseline,
  Divider,
  IconButton,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Tooltip,
  Typography,
  useMediaQuery,
} from '@mui/material';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import ChevronLeftIcon  from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';

import AppNavBar from './AppNavBar';
import Loader    from './Loader';

// ─── Layout constants ─────────────────────────────────────────────────────────

const DRAWER_WIDTH = 240;

const openedMixin = (theme) => ({
  width: DRAWER_WIDTH,
  transition: theme.transitions.create('width', {
    easing:   theme.transitions.easing.sharp,
    duration: theme.transitions.duration.enteringScreen,
  }),
  overflowX: 'hidden',
});

const closedMixin = (theme) => ({
  transition: theme.transitions.create('width', {
    easing:   theme.transitions.easing.sharp,
    duration: theme.transitions.duration.leavingScreen,
  }),
  overflowX: 'hidden',
  width: `calc(${theme.spacing(7)} + 1px)`,
  [theme.breakpoints.up('sm')]: {
    width: `calc(${theme.spacing(8)} + 1px)`,
  },
});

// Spacer that pushes content below the fixed AppBar.
const DrawerHeader = styled('div')(({ theme }) => ({
  display:        'flex',
  alignItems:     'center',
  justifyContent: 'flex-end',
  padding:        theme.spacing(0, 1),
  ...theme.mixins.toolbar,
}));

// Desktop-only permanent drawer with mini ↔ full animation.
const PermanentDrawer = styled(MuiDrawer, {
  shouldForwardProp: (p) => p !== 'open',
})(({ theme }) => ({
  width:        DRAWER_WIDTH,
  flexShrink:   0,
  whiteSpace:   'nowrap',
  boxSizing:    'border-box',
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
}));

// ─── Component ────────────────────────────────────────────────────────────────

const AppShell = ({ navItems = [], drawerLabel = '', pageTitle = '' }) => {
  const theme     = useTheme();
  const location  = useLocation();
  const navigate  = useNavigate();
  const isDesktop = useMediaQuery(theme.breakpoints.up('md'));

  const [open, setOpen] = useState(false);

  const handleNavigate = (link) => {
    navigate(link);
    // On mobile close the overlay after navigation.
    if (!isDesktop) setOpen(false);
  };

  // On mobile the temporary drawer is always full-width when visible → always
  // show labels. On desktop only show labels when the drawer is expanded.
  const showText = !isDesktop || open;

  // ── Shared drawer content (used by both variants) ──────────────────────────

  const drawerContent = (
    <>
      <DrawerHeader>
        {showText && drawerLabel && (
          <Typography
            variant="caption"
            fontWeight={700}
            color="primary"
            noWrap
            sx={{ flexGrow: 1, pl: 1, letterSpacing: '0.08em', textTransform: 'uppercase' }}
          >
            {drawerLabel}
          </Typography>
        )}
        <IconButton onClick={() => setOpen(false)} aria-label="close drawer">
          {theme.direction === 'rtl' ? <ChevronRightIcon /> : <ChevronLeftIcon />}
        </IconButton>
      </DrawerHeader>

      <Divider />

      <List>
        {navItems.map((item) => {
          // Support divider items: { type: 'divider', label: '<unique-key>' }
          if (item.type === 'divider') {
            return <Divider key={item.label} sx={{ my: 0.5 }} />;
          }

          // Use label as key — it is always unique and stable across state changes,
          // unlike item.link which can be null/duplicate for async-driven navItems
          // (e.g. Parent portal before firstChildId resolves).
          const isActive = item.link
            ? item.link === '/'
              ? location.pathname === '/'
              : location.pathname === item.link
            : false;

          return (
            <ListItem
              key={item.label}
              disablePadding
              sx={{ display: 'block' }}
            >
              <Tooltip title={showText ? '' : item.label} placement="right">
                <ListItemButton
                  onClick={() => item.link && !item.disabled && handleNavigate(item.link)}
                  selected={isActive}
                  disabled={item.disabled}
                  sx={[
                    { minHeight: 48, px: 2.5 },
                    showText
                      ? { justifyContent: 'initial' }
                      : { justifyContent: 'center' },
                    isActive && {
                      bgcolor:     'rgba(73,137,200,0.12)',
                      borderRight: '3px solid',
                      borderColor: 'primary.main',
                    },
                    item.accent && {
                      color:   item.accent,
                      bgcolor: `${item.accent}10`,
                      '&:hover': { bgcolor: `${item.accent}1a` },
                    },
                  ]}
                >
                  <ListItemIcon
                    sx={[
                      {
                        minWidth:       0,
                        justifyContent: 'center',
                        color: item.accent
                          ? item.accent
                          : isActive ? 'primary.main' : 'inherit',
                      },
                      showText ? { mr: 3 } : { mr: 'auto' },
                    ]}
                  >
                    <item.icon fontSize="small" />
                  </ListItemIcon>
                  <ListItemText
                    primary={item.label}
                    primaryTypographyProps={{
                      fontSize:   '0.875rem',
                      fontWeight: isActive ? 600 : 400,
                    }}
                    sx={showText ? { opacity: 1 } : { opacity: 0 }}
                  />
                </ListItemButton>
              </Tooltip>
            </ListItem>
          );
        })}
      </List>

      <Divider />
    </>
  );

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <Box sx={{ display: 'flex' }}>
      <CssBaseline />

      {/*
       * Pass drawerOpen only when on desktop so the AppBar only shifts
       * when the permanent desktop drawer expands.
       * On mobile the temporary drawer overlays the content; the AppBar
       * should stay full-width.
       */}
      <AppNavBar
        drawerOpen={open && isDesktop}
        onDrawerOpen={() => setOpen(true)}
        pageTitle={pageTitle}
      />

      {/* ── Mobile: temporary overlay drawer ── */}
      {!isDesktop && (
        <MuiDrawer
          variant="temporary"
          open={open}
          onClose={() => setOpen(false)}
          ModalProps={{ keepMounted: true }}
          sx={{
            zIndex: (t) => t.zIndex.appBar - 1,
            '& .MuiDrawer-paper': { width: DRAWER_WIDTH, boxSizing: 'border-box' },
          }}
        >
          {drawerContent}
        </MuiDrawer>
      )}

      {/* ── Desktop: permanent mini / full drawer ── */}
      {isDesktop && (
        <PermanentDrawer variant="permanent" open={open}>
          {drawerContent}
        </PermanentDrawer>
      )}

      {/* ── Main content area ── */}
      <Box
        component="main"
        sx={{
          flexGrow:   1,
          minHeight:  '100vh',
          minWidth:   0,   // prevent flex child from overflowing
          overflowX:  'hidden',
        }}
      >
        {/* Spacer — same height as the fixed AppBar */}
        <DrawerHeader />

        <Suspense fallback={<Loader />}>
          <Outlet />
        </Suspense>
      </Box>
    </Box>
  );
};

export default AppShell;
