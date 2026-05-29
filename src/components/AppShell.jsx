/**
 * @file AppShell.jsx
 * @description Shared responsive layout shell used by every authenticated role.
 *
 * Responsive behaviour:
 *   < md  (mobile/tablet) → Temporary overlay drawer.
 *   ≥ md  (desktop)       → Permanent mini drawer (icons only) that expands to
 *                           240 px on hamburger click.
 *
 * navItems types:
 *   { link, label, icon, disabled?, accent? }       — regular item
 *   { type: 'divider', label: '<unique-key>' }       — horizontal separator
 *   { type: 'group', label, icon, items: [...] }     — collapsible section
 *     └ items follow the same shape as regular items
 *
 * Group state (open/closed) is persisted in localStorage under the key
 * 'appshell_groups'.  The group that contains the active route is
 * automatically expanded on mount and on navigation.
 */

import { useState, useEffect, useRef, Fragment, Suspense } from 'react';
import { styled, useTheme }   from '@mui/material/styles';
import {
  Box,
  Collapse,
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
import ExpandLessIcon   from '@mui/icons-material/ExpandLess';
import ExpandMoreIcon   from '@mui/icons-material/ExpandMore';

import AppNavBar from './AppNavBar';
import Loader    from './Loader';

// ─── Layout constants ─────────────────────────────────────────────────────────

const DRAWER_WIDTH    = 240;
const ITEM_HEIGHT     = 40;   // regular & group-header items (was 48)
const CHILD_HEIGHT    = 37;   // indented children inside a group
const LS_GROUPS_KEY   = 'appshell_groups';

// ─── Styled helpers ───────────────────────────────────────────────────────────

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

const DrawerHeader = styled('div')(({ theme }) => ({
  display:        'flex',
  alignItems:     'center',
  justifyContent: 'flex-end',
  padding:        theme.spacing(0, 1),
  ...theme.mixins.toolbar,
}));

const PermanentDrawer = styled(MuiDrawer, {
  shouldForwardProp: (p) => p !== 'open',
})(({ theme }) => ({
  width:      DRAWER_WIDTH,
  flexShrink: 0,
  whiteSpace: 'nowrap',
  boxSizing:  'border-box',
  variants: [
    { props: ({ open }) =>  open, style: { ...openedMixin(theme), '& .MuiDrawer-paper': openedMixin(theme) } },
    { props: ({ open }) => !open, style: { ...closedMixin(theme), '& .MuiDrawer-paper': closedMixin(theme) } },
  ],
}));

// ─── localStorage helpers ─────────────────────────────────────────────────────

const readGroupState = () => {
  try { return JSON.parse(localStorage.getItem(LS_GROUPS_KEY) ?? '{}'); }
  catch { return {}; }
};

const writeGroupState = (state) => {
  try { localStorage.setItem(LS_GROUPS_KEY, JSON.stringify(state)); }
  catch {}
};

// ─── Component ────────────────────────────────────────────────────────────────

const AppShell = ({ navItems = [], drawerLabel = '', pageTitle = '' }) => {
  const theme     = useTheme();
  const location  = useLocation();
  const navigate  = useNavigate();
  const isDesktop = useMediaQuery(theme.breakpoints.up('md'));

  const [open,      setOpen]      = useState(false);
  const [groupOpen, setGroupOpen] = useState(readGroupState);

  // Stable ref so effects don't re-run when parent re-renders navItems inline.
  const navRef = useRef(navItems);
  useEffect(() => { navRef.current = navItems; }, [navItems]);

  // Auto-expand the group that contains the active route.
  useEffect(() => {
    navRef.current.forEach((item) => {
      if (item.type !== 'group' || !item.items) return;
      const hasActive = item.items.some(
        (child) => child.link && child.link !== '/' && location.pathname === child.link,
      );
      if (!hasActive) return;
      setGroupOpen((prev) => {
        if (prev[item.label]) return prev;          // already open — no update
        const next = { ...prev, [item.label]: true };
        writeGroupState(next);
        return next;
      });
    });
  }, [location.pathname]);

  const handleNavigate = (link) => {
    navigate(link);
    if (!isDesktop) {
      setOpen(false);
      // On mobile: collapse all groups except the one containing the target route,
      // so the drawer opens clean next time (only the active section is expanded).
      setGroupOpen((prev) => {
        const next = { ...prev };
        navRef.current.forEach((item) => {
          if (item.type !== 'group' || !item.items) return;
          const ownsTarget = item.items.some((child) => child.link === link);
          next[item.label] = ownsTarget;
        });
        writeGroupState(next);
        return next;
      });
    }
  };

  const toggleGroup = (label) => {
    // In mini mode on desktop: open the drawer first, always expand the group.
    if (isDesktop && !open) {
      setOpen(true);
      setGroupOpen((prev) => {
        const next = { ...prev, [label]: true };
        writeGroupState(next);
        return next;
      });
      return;
    }
    setGroupOpen((prev) => {
      const next = { ...prev, [label]: !prev[label] };
      writeGroupState(next);
      return next;
    });
  };

  // Labels are shown when the drawer is expanded or on mobile (always full-width).
  const showText = !isDesktop || open;

  // ── Item renderers ──────────────────────────────────────────────────────────

  const renderRegularItem = (item) => {
    const isActive = item.link
      ? item.link === '/'
        ? location.pathname === '/'
        : location.pathname === item.link
      : false;

    return (
      <ListItem key={item.label} disablePadding sx={{ display: 'block' }}>
        <Tooltip title={showText ? '' : item.label} placement="right">
          <ListItemButton
            onClick={() => item.link && !item.disabled && handleNavigate(item.link)}
            selected={isActive}
            disabled={item.disabled}
            sx={[
              { minHeight: ITEM_HEIGHT, px: 2.5 },
              showText ? { justifyContent: 'initial' } : { justifyContent: 'center' },
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
            <ListItemIcon sx={[
              { minWidth: 0, justifyContent: 'center', color: item.accent ? item.accent : isActive ? 'primary.main' : 'inherit' },
              showText ? { mr: 3 } : { mr: 'auto' },
            ]}>
              <item.icon fontSize="small" />
            </ListItemIcon>
            <ListItemText
              primary={item.label}
              primaryTypographyProps={{ fontSize: '0.875rem', fontWeight: isActive ? 600 : 400 }}
              sx={showText ? { opacity: 1 } : { opacity: 0 }}
            />
          </ListItemButton>
        </Tooltip>
      </ListItem>
    );
  };

  const renderGroupItem = (item) => {
    const isExpanded  = !!groupOpen[item.label];
    const hasActive   = item.items?.some(
      (child) => child.link && child.link !== '/' && location.pathname === child.link,
    ) ?? false;

    return (
      <Fragment key={item.label}>
        {/* ── Group header — wrapped in ListItem for correct MUI List structure ── */}
        <ListItem disablePadding sx={{ display: 'block' }}>
          <Tooltip title={showText ? '' : item.label} placement="right">
            <ListItemButton
              onClick={() => toggleGroup(item.label)}
              sx={[
                { minHeight: ITEM_HEIGHT, px: 2.5, position: 'relative' }, // position:relative for the dot indicator
                showText ? { justifyContent: 'initial' } : { justifyContent: 'center' },
                !isExpanded && hasActive && { color: 'primary.main' },
              ]}
            >
              <ListItemIcon sx={[
                { minWidth: 0, justifyContent: 'center', color: (!isExpanded && hasActive) ? 'primary.main' : 'inherit' },
                showText ? { mr: 3 } : { mr: 'auto' },
              ]}>
                <item.icon fontSize="small" />
              </ListItemIcon>

              {showText && (
                <>
                  <ListItemText
                    primary={item.label}
                    primaryTypographyProps={{
                      fontSize:      '0.78rem',
                      fontWeight:    600,
                      textTransform: 'uppercase',
                      letterSpacing: '0.06em',
                      color:         'text.secondary',
                    }}
                    sx={{ opacity: 1, flex: 1 }}
                  />
                  {isExpanded
                    ? <ExpandLessIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                    : <ExpandMoreIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                  }
                </>
              )}

              {/* Active-group dot — mini mode only. position:relative on parent ensures correct placement. */}
              {!showText && hasActive && (
                <Box sx={{
                  position: 'absolute', right: 6, top: '50%', transform: 'translateY(-50%)',
                  width: 6, height: 6, borderRadius: '50%', bgcolor: 'primary.main',
                }} />
              )}
            </ListItemButton>
          </Tooltip>
        </ListItem>

        {/* ── Children (only rendered when drawer is expanded) ── */}
        <Collapse in={showText && isExpanded} timeout="auto" unmountOnExit>
          <List disablePadding>
            {item.items?.map((child) => {
              const childActive = child.link
                ? child.link === '/'
                  ? location.pathname === '/'
                  : location.pathname === child.link
                : false;

              return (
                <ListItem key={child.label} disablePadding sx={{ display: 'block' }}>
                  <ListItemButton
                    onClick={() => child.link && !child.disabled && handleNavigate(child.link)}
                    selected={childActive}
                    disabled={child.disabled}
                    sx={[
                      { minHeight: CHILD_HEIGHT, pl: 4.5, pr: 2 },
                      childActive && {
                        bgcolor:     'rgba(73,137,200,0.12)',
                        borderRight: '3px solid',
                        borderColor: 'primary.main',
                      },
                    ]}
                  >
                    <ListItemIcon sx={{
                      minWidth: 0, mr: 2, justifyContent: 'center',
                      color: childActive ? 'primary.main' : 'text.secondary',
                    }}>
                      <child.icon sx={{ fontSize: 18 }} />
                    </ListItemIcon>
                    <ListItemText
                      primary={child.label}
                      primaryTypographyProps={{
                        fontSize:   '0.845rem',
                        fontWeight: childActive ? 600 : 400,
                      }}
                    />
                  </ListItemButton>
                </ListItem>
              );
            })}
          </List>
        </Collapse>
      </Fragment>
    );
  };

  // ── Drawer content ──────────────────────────────────────────────────────────

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

      <List sx={{ py: 0.5 }}>
        {navItems.map((item) => {
          if (item.type === 'divider') return <Divider key={item.label} sx={{ my: 0.5 }} />;
          if (item.type === 'group')   return renderGroupItem(item);
          return renderRegularItem(item);
        })}
      </List>

      <Divider />
    </>
  );

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <Box sx={{ display: 'flex' }}>
      <CssBaseline />

      <AppNavBar
        drawerOpen={open && isDesktop}
        onDrawerOpen={() => setOpen(true)}
        pageTitle={pageTitle}
      />

      {/* Mobile: temporary overlay drawer */}
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

      {/* Desktop: permanent mini / full drawer */}
      {isDesktop && (
        <PermanentDrawer variant="permanent" open={open}>
          {drawerContent}
        </PermanentDrawer>
      )}

      {/* Main content */}
      <Box
        component="main"
        sx={{ flexGrow: 1, minHeight: '100vh', minWidth: 0, overflowX: 'hidden' }}
      >
        <DrawerHeader />
        <Suspense fallback={<Loader />}>
          <Outlet />
        </Suspense>
      </Box>
    </Box>
  );
};

export default AppShell;
