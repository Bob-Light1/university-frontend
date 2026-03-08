import * as React from 'react';
import { styled, useTheme } from '@mui/material/styles';
import Box from '@mui/material/Box';
import MuiDrawer from '@mui/material/Drawer';
import MuiAppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import List from '@mui/material/List';
import CssBaseline from '@mui/material/CssBaseline';
import Typography from '@mui/material/Typography';
import Divider from '@mui/material/Divider';
import IconButton from '@mui/material/IconButton';
import MenuIcon from '@mui/icons-material/Menu';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import ListItem from '@mui/material/ListItem';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import { Outlet, useNavigate, useParams } from 'react-router-dom';
import { useLocation } from 'react-router-dom';
import { Suspense } from 'react';
import Loader from '../components/Loader';
import Avatar from '@mui/material/Avatar';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import { useAuth } from '../hooks/useAuth';
import { IMAGE_BASE_URL } from '../config/env';

// IMPORT ICONS
import RecordVoiceOverIcon from '@mui/icons-material/RecordVoiceOver';
import GroupIcon from '@mui/icons-material/Group';
import DashboardCustomizeIcon from '@mui/icons-material/DashboardCustomize';
import SubjectIcon from '@mui/icons-material/Subject';
import LibraryBooksIcon from '@mui/icons-material/LibraryBooks';
import EventNoteIcon from '@mui/icons-material/EventNote';
import NotificationsActiveIcon from '@mui/icons-material/NotificationsActive';
import FamilyRestroomIcon from '@mui/icons-material/FamilyRestroom';
import ChecklistRtlIcon from '@mui/icons-material/ChecklistRtl';
import ExplicitIcon from '@mui/icons-material/Explicit';
import HomeIcon from '@mui/icons-material/Home';
import LogoutIcon from '@mui/icons-material/Logout';
import AssessmentIcon from '@mui/icons-material/Assessment';

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
  // necessary for content to be below app bar
  ...theme.mixins.toolbar,
}));

const AppBar = styled(MuiAppBar, {
  shouldForwardProp: (prop) => prop !== 'open',
})(({ theme }) => ({
  zIndex: theme.zIndex.drawer + 1,
  transition: theme.transitions.create(['width', 'margin'], {
    easing: theme.transitions.easing.sharp,
    duration: theme.transitions.duration.leavingScreen,
  }),
  variants: [
    {
      props: ({ open }) => open,
      style: {
        marginLeft: drawerWidth,
        width: `calc(100% - ${drawerWidth}px)`,
        transition: theme.transitions.create(['width', 'margin'], {
          easing: theme.transitions.easing.sharp,
          duration: theme.transitions.duration.enteringScreen,
        }),
      },
    },
  ],
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


export default function Campus() {
  const { campusId } = useParams();
  const { user, logout } = useAuth();
  const [open, setOpen] = React.useState(false);
  const [anchorEl, setAnchorEl] = React.useState(null);
  const openMenu = Boolean(anchorEl);
  const theme = useTheme();
  const location = useLocation();

  const handleDrawerOpen = () => {
    setOpen(true);
  };

  const handleDrawerClose = () => {
    setOpen(false);
  };

  const handleProfileClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = () => {
    handleClose();
    logout();
  };

  const fullImageUrl = user?.image_url
  ? `${IMAGE_BASE_URL}${user.image_url}?t=${new Date().getTime()}` 
  : null;

  const navArray = [
    { link: "/", component: "Home", icon: HomeIcon },
    { link: `/campus/${campusId}/dashboard`, component: "Dashboard", icon: DashboardCustomizeIcon },
    { link: `/campus/${campusId}/students`, component: "Students", icon: GroupIcon },
    { link: `/campus/${campusId}/teachers`, component: "Teachers", icon: RecordVoiceOverIcon },
    { link: `/campus/${campusId}/parents`, component: "Parents", icon: FamilyRestroomIcon },
    { link: `/campus/${campusId}/classes`, component: "Classes", icon: LibraryBooksIcon },
    { link: `/campus/${campusId}/subjects`, component: "Subjects", icon: SubjectIcon },
    { link: `/campus/${campusId}/examination`, component: "Examination", icon: ExplicitIcon },
    { link: `/campus/${campusId}/results`, component: "Results", icon: AssessmentIcon },
    { link: `/campus/${campusId}/schedule`, component: "Schedule", icon: EventNoteIcon },
    { link: `/campus/${campusId}/attendance`, component: "Attendance", icon: ChecklistRtlIcon },
    { link: `/campus/${campusId}/notification`, component: "Notification", icon: NotificationsActiveIcon },
  ];

  const navigate = useNavigate();
  const handleNavigation = (link) => {
    navigate(link);
  };

  return (
    <Box sx={{ display: 'flex' }}>
      <CssBaseline />
      <AppBar position="fixed" open={open}>
        <Toolbar sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <IconButton
            color="inherit"
            aria-label="open drawer"
            onClick={handleDrawerOpen}
            edge="start"
            sx={[
              {
                marginRight: 5,
              },
              open && { display: 'none' },
            ]}
          >
            <MenuIcon />
          </IconButton>
          <Typography variant="h6" noWrap component="div">
            Manage Your Campus
          </Typography>

          {/* Profile & Logout Section */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <IconButton onClick={handleProfileClick} sx={{ p: 0 }}>
              <Avatar
                // Optional: add user image
                src={fullImageUrl}
                alt={user?.manager_name}
                sx={{
                  bgcolor: user?.image_url ? 'transparent' : 'secondary.main',
                  width: 40,
                  height: 40,
                  border: '2px solid #fff',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                }}
              >
                {/* Fallback content: Initials if the image does not load */}
                {user?.manager_name ? user.manager_name.charAt(0).toUpperCase() : 'U'}
              </Avatar>
            </IconButton>
            <Typography variant="body2" sx={{ display: { xs: 'none', sm: 'block' } }}>
              {user?.manager_name || 'User'}
            </Typography>
          </Box>

          {/* Dropdown Menu */}
          <Menu
            anchorEl={anchorEl}
            open={openMenu}
            onClose={handleClose}
            transformOrigin={{ horizontal: 'right', vertical: 'top' }}
            anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
            sx={{
              marginLeft: 10,
            }}
          >
            <MenuItem onClick={handleClose}>My profile</MenuItem>
            <Divider />
            <MenuItem onClick={handleLogout} sx={{ color: 'error.main' }}>
              <ListItemIcon>
                <LogoutIcon fontSize="small" sx={{ color: 'error.main' }} />
              </ListItemIcon>
              Log out
            </MenuItem>
          </Menu>
        </Toolbar>
      </AppBar>
      <Drawer variant="permanent" open={open}>
        <DrawerHeader>
          <IconButton onClick={handleDrawerClose}>
            {theme.direction === 'rtl' ? <ChevronRightIcon /> : <ChevronLeftIcon />}
          </IconButton>
        </DrawerHeader>
        <Divider />
        <List>
          {navArray.map((navItem, index) => (
            <ListItem key={index} disablePadding sx={{ display: 'block' }}>
              <ListItemButton
                sx={[
                  {
                    minHeight: 48,
                    px: 2.5,
                  },
                  open
                    ? {
                        justifyContent: 'initial',
                      }
                    : {
                        justifyContent: 'center',
                      },
                  
                  location.pathname === navItem.link && {
                    backgroundColor: 'rgba(73, 137, 200, 0.15)',
                    borderRight: '4px solid #4989c8',
                  }
                ]}
                onClick={() => { handleNavigation(navItem.link) }}
              >
                <ListItemIcon
                  sx={[
                    {
                      minWidth: 0,
                      justifyContent: 'center',
                    },
                    open
                      ? {
                          mr: 3,
                        }
                      : {
                          mr: 'auto',
                        },
                  ]}
                >
                  {<navItem.icon />}
                </ListItemIcon>
                <ListItemText
                  primary={navItem.component}
                  sx={[
                    open
                      ? {
                          opacity: 1,
                        }
                      : {
                          opacity: 0,
                        },
                  ]}
                />
              </ListItemButton>
            </ListItem>
          ))}
        </List>
        <Divider />
      </Drawer>
      <Box component="main" sx={{ flexGrow: 1 }}>
        <DrawerHeader />
        <Suspense fallback={<Loader />}>
          <Outlet />
        </Suspense>
      </Box>
    </Box>
  );
}