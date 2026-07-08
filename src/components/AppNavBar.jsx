/**
 * @file AppNavBar.jsx
 * @description Shared top AppBar used across all role-based layouts:
 *   Campus (Manager/Admin/Director), Teacher, Student, Parent.
 *
 * Features:
 *  - Dynamic page title per role
 *  - AI button → the role's AI hub (hidden for roles that have no hub)
 *  - Notification badge
 *  - Profile avatar with dropdown menu (My Profile + Logout)
 *  - Breadcrumb trail based on current route
 *  - Responsive: hides labels on xs
 *
 * Props:
 *  @prop {boolean}  drawerOpen   – Whether the side drawer is open
 *  @prop {Function} onDrawerOpen – Callback to open the drawer
 *  @prop {string}   pageTitle    – Title shown in the AppBar center/left
 */

import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

import {
  AppBar as MuiAppBar,
  Toolbar,
  IconButton,
  Typography,
  Avatar,
  Box,
  Tooltip,
  Menu,
  MenuItem,
  ListItemIcon,
  Divider,
  Stack,
  alpha,
  styled,
} from '@mui/material';

import MenuIcon            from '@mui/icons-material/Menu';
import AutoAwesomeIcon     from '@mui/icons-material/AutoAwesome';
import LogoutIcon          from '@mui/icons-material/Logout';
import PersonIcon          from '@mui/icons-material/Person';
import SettingsIcon        from '@mui/icons-material/Settings';
import NavigateNextIcon    from '@mui/icons-material/NavigateNext';
import HomeIcon            from '@mui/icons-material/Home';

import { useAuth }             from '../hooks/useAuth';
import { useAppTranslation }  from '../hooks/useAppTranslation';
import { IMAGE_BASE_URL } from '../config/env';
import NotificationBell from './notifications/NotificationBell';

// ─── Constants ────────────────────────────────────────────────────────────────

const drawerWidth = 240;

// ─── Styled AppBar (shifts when drawer opens) ─────────────────────────────────

export const StyledAppBar = styled(MuiAppBar, {
  shouldForwardProp: (prop) => prop !== 'drawerOpen',
})(({ theme, drawerOpen }) => ({
  zIndex: theme.zIndex.drawer + 1,
  backdropFilter: 'blur(8px)',
  backgroundColor: alpha(theme.palette.primary.main, 0.96),
  boxShadow: '0 1px 8px rgba(0,0,0,0.18)',
  transition: theme.transitions.create(['width', 'margin'], {
    easing: theme.transitions.easing.sharp,
    duration: theme.transitions.duration.leavingScreen,
  }),
  ...(drawerOpen && {
    marginLeft: drawerWidth,
    width: `calc(100% - ${drawerWidth}px)`,
    transition: theme.transitions.create(['width', 'margin'], {
      easing: theme.transitions.easing.sharp,
      duration: theme.transitions.duration.enteringScreen,
    }),
  }),
}));

// ─── Breadcrumb helpers ────────────────────────────────────────────────────────

/**
 * Builds a simple 2-segment breadcrumb from the current pathname.
 * e.g. /campus/123/students → ["Campus", "Students"]
 */
const useBreadcrumbs = () => {
  const { pathname } = useLocation();
  const segments = pathname.split('/').filter(Boolean);

  // Skip UUIDs / ObjectIds (24-char hex or numeric strings)
  const readable = segments.filter((s) => !/^[a-f0-9]{24}$|^\d+$/.test(s));

  const capitalize = (s) => s.charAt(0).toUpperCase() + s.slice(1);

  return readable.map(capitalize);
};

// ─── Main Component ────────────────────────────────────────────────────────────

const AppNavBar = ({ drawerOpen, onDrawerOpen, pageTitle }) => {
  const { user, logout } = useAuth();
  const { t } = useAppTranslation('common');

  const [profileAnchor, setProfileAnchor] = useState(null);

  const navigate     = useNavigate();
  const breadcrumbs  = useBreadcrumbs();

  // Build avatar source URL (with cache-busting)
  const avatarSrc = user?.image_url
    ? (user.image_url.startsWith('http')
        ? `${user.image_url}?t=${Date.now()}`
        : `${IMAGE_BASE_URL}${user.image_url}?t=${Date.now()}`)
    : null;

  // Derive display name from any user type shape
  const displayName =
    user?.manager_name ||
    user?.teacher_name ||
    user?.student_name ||
    user?.parent_name  ||
    user?.name         ||
    user?.email        ||
    'User';

  const displayInitial = displayName.charAt(0).toUpperCase();

  // Derive user type label for subtitle
  const userTypeLabel = {
    manager:  'Campus Manager',
    admin:    'Administrator',
    director: 'Director',
    teacher:  'Teacher',
    student:  'Student',
    parent:   'Parent',
    partner:  'Partner',
    mentor:   'Mentor',
    staff:    'Staff',
  }[user?.userType] ?? user?.userType ?? '';

  // Profile route keyed on user.role (JWT field) — more reliable than userType
  // since Admin and Director share the same userType ('admin') but have different
  // profile pages.  null = no profile page exists for this role.
  const profileRoute = {
    TEACHER:  '/teacher/profile',
    STUDENT:  '/student/profile',
    PARENT:   '/parent/profile',
    PARTNER:  '/partner/profile',
    MENTOR:   '/mentor/profile',
    STAFF:    '/staff/profile',
    ADMIN:    '/admin/profile',
    DIRECTOR: '/director/profile',
  }[user?.role] ?? null;

  // Settings route — only Campus Manager has a portal-level settings page.
  const settingsRoute = user?.role === 'CAMPUS_MANAGER'
    ? `/campus/${user?.id}/settings`
    : null;

  // AI hub route, keyed on the JWT role. Global roles reach the platform
  // workspace (which picks the target campus); a Campus Manager reaches their
  // own campus hub — user.id is the campus _id for that role (see CampusGuard).
  // null = this role has no AI surface yet → the button is not rendered rather
  // than opening something inert.
  const aiRoute = {
    ADMIN:          '/admin/ai',
    DIRECTOR:       '/director/ai',
    CAMPUS_MANAGER: user?.id ? `/campus/${user.id}/ai` : null,
  }[user?.role] ?? null;

  // ── Handlers ──────────────────────────────────────────────────────────────

  const handleProfileOpen  = (e) => setProfileAnchor(e.currentTarget);
  const handleProfileClose = ()  => setProfileAnchor(null);

  const handleLogout = () => {
    handleProfileClose();
    logout();
  };

  const handleGoProfile = () => {
    handleProfileClose();
    if (profileRoute) navigate(profileRoute);
  };

  const handleGoSettings = () => {
    handleProfileClose();
    if (settingsRoute) navigate(settingsRoute);
  };

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <>
      <StyledAppBar position="fixed" drawerOpen={drawerOpen}>
        <Toolbar sx={{ display: 'flex', alignItems: 'center', gap: 1, minHeight: 64 }}>

          {/* ── Hamburger (hidden when drawer is open) ── */}
          {!drawerOpen && (
            <IconButton
              color="inherit"
              aria-label="open drawer"
              onClick={onDrawerOpen}
              edge="start"
              sx={{ mr: 1 }}
            >
              <MenuIcon />
            </IconButton>
          )}

          {/* ── Page title + breadcrumb ── */}
          <Box sx={{ flexGrow: 1, minWidth: 0 }}>
            <Typography
              variant="h6"
              noWrap
              fontWeight={700}
              sx={{ lineHeight: 1.2, letterSpacing: '-0.01em' }}
            >
              {pageTitle}
            </Typography>

            {/* Breadcrumb — only show when there are meaningful segments */}
            {breadcrumbs.length > 1 && (
              <Stack direction="row" alignItems="center" spacing={0.5} sx={{ mt: 0.1 }}>
                <HomeIcon sx={{ fontSize: 12, opacity: 0.7 }} />
                {breadcrumbs.map((crumb, i) => (
                  <Stack key={crumb} direction="row" alignItems="center" spacing={0.5}>
                    {i > 0 && (
                      <NavigateNextIcon sx={{ fontSize: 12, opacity: 0.6 }} />
                    )}
                    <Typography
                      variant="caption"
                      sx={{
                        opacity: i === breadcrumbs.length - 1 ? 1 : 0.7,
                        fontWeight: i === breadcrumbs.length - 1 ? 600 : 400,
                        lineHeight: 1,
                      }}
                    >
                      {crumb}
                    </Typography>
                  </Stack>
                ))}
              </Stack>
            )}
          </Box>

          {/* ── AI Button — direct entry to the role's AI hub ── */}
          {aiRoute && (
            <Tooltip title={t('user.aiAssistant')}>
              <IconButton
                color="inherit"
                onClick={() => navigate(aiRoute)}
                aria-label={t('user.aiAssistant')}
                sx={{
                  bgcolor: alpha('#fff', 0.12),
                  '&:hover': { bgcolor: alpha('#fff', 0.22) },
                  borderRadius: 2,
                  px: 1.5,
                  gap: 0.75,
                  display: 'flex',
                  alignItems: 'center',
                }}
              >
                <AutoAwesomeIcon fontSize="small" />
                <Typography
                  variant="caption"
                  fontWeight={600}
                  sx={{ display: { xs: 'none', sm: 'block' }, lineHeight: 1 }}
                >
                  AI
                </Typography>
              </IconButton>
            </Tooltip>
          )}

          {/* ── Notifications ── */}
          <NotificationBell />

          {/* ── Profile Avatar ── */}
          <Tooltip title={displayName}>
            <IconButton
              onClick={handleProfileOpen}
              aria-controls="profile-menu"
              aria-haspopup="true"
              aria-expanded={Boolean(profileAnchor) ? 'true' : undefined}
              sx={{ p: 0, ml: 0.5 }}
            >
              <Avatar
                src={avatarSrc}
                alt={displayName}
                sx={{
                  width: 38,
                  height: 38,
                  border: '2px solid',
                  borderColor: alpha('#fff', 0.6),
                  bgcolor: avatarSrc ? 'transparent' : 'secondary.main',
                  fontSize: '0.95rem',
                  fontWeight: 700,
                  boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
                }}
              >
                {displayInitial}
              </Avatar>
            </IconButton>
          </Tooltip>

          {/* Inline name (hidden on xs) */}
          <Box sx={{ display: { xs: 'none', md: 'block' }, minWidth: 0 }}>
            <Typography
              variant="body2"
              fontWeight={600}
              noWrap
              sx={{ lineHeight: 1.2, maxWidth: 140 }}
            >
              {displayName}
            </Typography>
            {userTypeLabel && (
              <Typography
                variant="caption"
                noWrap
                sx={{ opacity: 0.75, lineHeight: 1, display: 'block' }}
              >
                {userTypeLabel}
              </Typography>
            )}
          </Box>

          {/* ── Profile dropdown ── */}
          <Menu
            id="profile-menu"
            anchorEl={profileAnchor}
            open={Boolean(profileAnchor)}
            onClose={handleProfileClose}
            transformOrigin={{ horizontal: 'right', vertical: 'top' }}
            anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
            slotProps={{
              paper: {
                elevation: 4,
                sx: {
                  mt: 1,
                  minWidth: 200,
                  borderRadius: 2,
                  overflow: 'visible',
                  '&::before': {
                    content: '""',
                    display: 'block',
                    position: 'absolute',
                    top: 0,
                    right: 18,
                    width: 10,
                    height: 10,
                    bgcolor: 'background.paper',
                    transform: 'translateY(-50%) rotate(45deg)',
                    zIndex: 0,
                  },
                },
              },
            }}
          >
            {/* User identity header */}
            <Box sx={{ px: 2, py: 1.5, borderBottom: '1px solid', borderColor: 'divider' }}>
              <Typography variant="subtitle2" fontWeight={700} noWrap>
                {displayName}
              </Typography>
              {userTypeLabel && (
                <Typography variant="caption" color="text.secondary" noWrap>
                  {userTypeLabel}
                </Typography>
              )}
            </Box>

            {profileRoute && (
              <MenuItem onClick={handleGoProfile} sx={{ gap: 1.5, py: 1.2 }}>
                <ListItemIcon sx={{ minWidth: 'unset' }}>
                  <PersonIcon fontSize="small" />
                </ListItemIcon>
                {t('user.myProfile')}
              </MenuItem>
            )}

            {settingsRoute && (
              <MenuItem onClick={handleGoSettings} sx={{ gap: 1.5, py: 1.2 }}>
                <ListItemIcon sx={{ minWidth: 'unset' }}>
                  <SettingsIcon fontSize="small" />
                </ListItemIcon>
                {t('user.settings')}
              </MenuItem>
            )}

            <Divider />

            <MenuItem
              onClick={handleLogout}
              sx={{ gap: 1.5, py: 1.2, color: 'error.main' }}
            >
              <ListItemIcon sx={{ minWidth: 'unset' }}>
                <LogoutIcon fontSize="small" sx={{ color: 'error.main' }} />
              </ListItemIcon>
              {t('user.signOut')}
            </MenuItem>
          </Menu>
        </Toolbar>
      </StyledAppBar>
    </>
  );
};

export default AppNavBar;