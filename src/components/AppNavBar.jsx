/**
 * @file AppNavBar.jsx
 * @description Shared top AppBar used across all role-based layouts:
 *   Campus (Manager/Admin/Director), Teacher, Student, Parent.
 *
 * Features:
 *  - Dynamic page title per role
 *  - AI Chat button → Dialog (coming soon placeholder with chat UI shell)
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
  Badge,
  Dialog,
  DialogTitle,
  DialogContent,
  Chip,
  Stack,
  Paper,
  alpha,
  styled,
} from '@mui/material';

import MenuIcon            from '@mui/icons-material/Menu';
import AutoAwesomeIcon     from '@mui/icons-material/AutoAwesome';
import NotificationsIcon   from '@mui/icons-material/Notifications';
import LogoutIcon          from '@mui/icons-material/Logout';
import PersonIcon          from '@mui/icons-material/Person';
import SettingsIcon        from '@mui/icons-material/Settings';
import CloseIcon           from '@mui/icons-material/Close';
import SmartToyOutlinedIcon from '@mui/icons-material/SmartToyOutlined';
import NavigateNextIcon    from '@mui/icons-material/NavigateNext';
import HomeIcon            from '@mui/icons-material/Home';

import { useAuth }        from '../hooks/useAuth';
import { IMAGE_BASE_URL } from '../config/env';

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

// ─── AI Chat Coming Soon Dialog ───────────────────────────────────────────────

const AiChatDialog = ({ open, onClose }) => (
  <Dialog
    open={open}
    onClose={onClose}
    maxWidth="sm"
    fullWidth
    PaperProps={{
      sx: {
        borderRadius: 3,
        overflow: 'hidden',
        height: 520,
        display: 'flex',
        flexDirection: 'column',
      },
    }}
  >
    {/* Dialog header — chat style */}
    <DialogTitle
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: 1.5,
        bgcolor: 'primary.main',
        color: 'primary.contrastText',
        py: 1.5,
        px: 2,
      }}
    >
      <Avatar sx={{ bgcolor: 'primary.dark', width: 36, height: 36 }}>
        <SmartToyOutlinedIcon fontSize="small" />
      </Avatar>
      <Box sx={{ flexGrow: 1 }}>
        <Typography variant="subtitle1" fontWeight={700} lineHeight={1.2}>
          Campus AI Assistant
        </Typography>
        <Typography variant="caption" sx={{ opacity: 0.8 }}>
          Powered by wewigo
        </Typography>
      </Box>
      <Chip
        label="Coming soon"
        size="small"
        sx={{
          bgcolor: alpha('#fff', 0.2),
          color: 'primary.contrastText',
          fontWeight: 600,
          fontSize: '0.65rem',
        }}
      />
      <IconButton size="small" onClick={onClose} sx={{ color: 'primary.contrastText' }}>
        <CloseIcon fontSize="small" />
      </IconButton>
    </DialogTitle>

    {/* Chat area */}
    <DialogContent
      sx={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'flex-end',
        gap: 2,
        bgcolor: (t) => alpha(t.palette.primary.main, 0.04),
        px: 2,
        py: 2,
      }}
    >
      {/* AI bubble */}
      <Stack direction="row" spacing={1.5} alignItems="flex-end">
        <Avatar sx={{ bgcolor: 'primary.main', width: 32, height: 32 }}>
          <SmartToyOutlinedIcon sx={{ fontSize: 18 }} />
        </Avatar>
        <Paper
          elevation={0}
          sx={{
            maxWidth: '78%',
            px: 2,
            py: 1.5,
            borderRadius: '16px 16px 16px 4px',
            bgcolor: 'background.paper',
            border: '1px solid',
            borderColor: 'divider',
          }}
        >
          <Typography variant="body2" color="text.primary" sx={{ lineHeight: 1.6 }}>
            👋 Bonjour ! Je suis <strong>Campus AI</strong>, votre assistant intelligent.
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5, lineHeight: 1.6 }}>
            Le module de chat avec l'IA sera bientôt disponible. Vous pourrez bientôt me poser
            toutes vos questions sur les étudiants, les résultats, les plannings et bien plus encore !
          </Typography>
        </Paper>
      </Stack>

      {/* Typing indicator placeholder */}
      <Stack direction="row" spacing={1.5} alignItems="center">
        <Avatar sx={{ bgcolor: 'primary.main', width: 32, height: 32 }}>
          <SmartToyOutlinedIcon sx={{ fontSize: 18 }} />
        </Avatar>
        <Box
          sx={{
            px: 2,
            py: 1,
            borderRadius: '16px 16px 16px 4px',
            bgcolor: 'background.paper',
            border: '1px solid',
            borderColor: 'divider',
            display: 'flex',
            gap: 0.5,
            alignItems: 'center',
          }}
        >
          {[0, 1, 2].map((i) => (
            <Box
              key={i}
              sx={{
                width: 6,
                height: 6,
                borderRadius: '50%',
                bgcolor: 'text.disabled',
                animation: 'pulse 1.4s ease-in-out infinite',
                animationDelay: `${i * 0.2}s`,
                '@keyframes pulse': {
                  '0%, 80%, 100%': { opacity: 0.3, transform: 'scale(0.9)' },
                  '40%': { opacity: 1, transform: 'scale(1.1)' },
                },
              }}
            />
          ))}
        </Box>
      </Stack>

      {/* Disabled input bar */}
      <Paper
        elevation={0}
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 1,
          px: 2,
          py: 1,
          border: '1px solid',
          borderColor: 'divider',
          borderRadius: 3,
          bgcolor: 'action.disabledBackground',
          opacity: 0.6,
          mt: 1,
        }}
      >
        <Typography variant="body2" color="text.disabled" sx={{ flex: 1 }}>
          Posez votre question…
        </Typography>
        <AutoAwesomeIcon sx={{ color: 'text.disabled', fontSize: 20 }} />
      </Paper>
    </DialogContent>
  </Dialog>
);

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

  const [profileAnchor, setProfileAnchor] = useState(null);
  const [aiDialogOpen,  setAiDialogOpen]  = useState(false);

  const navigate     = useNavigate();
  const breadcrumbs  = useBreadcrumbs();

  // Build avatar source URL (with cache-busting)
  const avatarSrc = user?.image_url
    ? `${IMAGE_BASE_URL}${user.image_url}?t=${Date.now()}`
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
  }[user?.userType] ?? user?.userType ?? '';

  // ── Handlers ──────────────────────────────────────────────────────────────

  const handleProfileOpen  = (e) => setProfileAnchor(e.currentTarget);
  const handleProfileClose = ()  => setProfileAnchor(null);

  const handleLogout = () => {
    handleProfileClose();
    logout();
  };

  const handleGoProfile = () => {
    handleProfileClose();
    // Navigate to the role's own profile / details page
    const base = {
      manager:  `#`,
      teacher:  '/teacher',
      student:  '/student',
      parent:   '/parent',
      admin:    '#',
      director: '#',
    }[user?.userType] ?? '/';
    navigate(base);
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

          {/* ── AI Button ── */}
          <Tooltip title="Campus AI Assistant">
            <IconButton
              color="inherit"
              onClick={() => setAiDialogOpen(true)}
              aria-label="Open AI assistant"
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

          {/* ── Notifications ── */}
          <Tooltip title="Notifications">
            <IconButton color="inherit" aria-label="notifications">
              <Badge badgeContent={0} color="error" max={99}>
                <NotificationsIcon />
              </Badge>
            </IconButton>
          </Tooltip>

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
            PaperProps={{
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

            <MenuItem onClick={handleGoProfile} sx={{ gap: 1.5, py: 1.2 }}>
              <ListItemIcon sx={{ minWidth: 'unset' }}>
                <PersonIcon fontSize="small" />
              </ListItemIcon>
              My Profile
            </MenuItem>

            <MenuItem onClick={handleProfileClose} sx={{ gap: 1.5, py: 1.2 }}>
              <ListItemIcon sx={{ minWidth: 'unset' }}>
                <SettingsIcon fontSize="small" />
              </ListItemIcon>
              Settings
            </MenuItem>

            <Divider />

            <MenuItem
              onClick={handleLogout}
              sx={{ gap: 1.5, py: 1.2, color: 'error.main' }}
            >
              <ListItemIcon sx={{ minWidth: 'unset' }}>
                <LogoutIcon fontSize="small" sx={{ color: 'error.main' }} />
              </ListItemIcon>
              Sign out
            </MenuItem>
          </Menu>
        </Toolbar>
      </StyledAppBar>

      {/* ── AI Chat Dialog ── */}
      <AiChatDialog
        open={aiDialogOpen}
        onClose={() => setAiDialogOpen(false)}
      />
    </>
  );
};

export default AppNavBar;