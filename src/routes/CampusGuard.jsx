import { useParams, useNavigate, Outlet } from 'react-router-dom';
import { useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import {
  Box,
  Typography,
  Button,
  Paper,
  Stack,
} from '@mui/material';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';

/**
 * CampusGuard — Campus-level isolation layer.
 *
 * Sits between ProtectedRoute (role check) and Campus (layout).
 * Enforces that CAMPUS_MANAGER users can only access their own campus.
 *
 * Access matrix:
 *  - ADMIN / DIRECTOR    → unrestricted access to any campus
 *  - CAMPUS_MANAGER      → only their own campus (user.id must match :campusId)
 *
 * Why user.id and not user._id:
 *   The campus login endpoint returns { id: campus._id, ... } in data.user.
 *   AuthContext stores that object as-is in localStorage/state, so the
 *   campus document _id is always available as user.id — never user._id.
 *   (See campus.controller.js → buildUserResponse / login handler)
 *
 * Note: TEACHER and STUDENT roles never reach this guard because
 *   ProtectedRoute only allows ADMIN, DIRECTOR, CAMPUS_MANAGER on the
 *   /campus/:campusId subtree. CampusGuard is purely a cross-campus
 *   isolation layer within that allowed role set.
 *
 * Wire-up in App.jsx:
 *   <Route element={<ProtectedRoute allowedRoles={['ADMIN','DIRECTOR','CAMPUS_MANAGER']} />}>
 *     <Route element={<CampusGuard />}>
 *       <Route path="campus/:campusId" element={<Campus />}>
 *         {campusRoutes}
 *       </Route>
 *     </Route>
 *   </Route>
 */
export default function CampusGuard() {
  const { campusId } = useParams();
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();

  const role = user?.role;

  // ADMIN and DIRECTOR have cross-campus (global) access — bypass check
  const isPrivileged = role === 'ADMIN' || role === 'DIRECTOR';
  if (isPrivileged) return <Outlet />;

  // CAMPUS_MANAGER: user.id is the campus _id (set by the campus login endpoint)
  const userCampusId = user?.id;
  const belongsToThisCampus =
    userCampusId && campusId && userCampusId.toString() === campusId.toString();

  if (belongsToThisCampus) return <Outlet />;

  // --- Access denied ---
  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
        p: 3,
      }}
    >
      <Paper
        elevation={0}
        sx={{
          maxWidth: 480,
          width: '100%',
          borderRadius: 4,
          p: { xs: 4, sm: 6 },
          textAlign: 'center',
          border: '1px solid rgba(0,0,0,0.08)',
          boxShadow: '0 8px 32px rgba(0,0,0,0.08)',
        }}
      >
        <Stack spacing={3} alignItems="center">
          {/* Lock icon */}
          <Box
            sx={{
              width: 80,
              height: 80,
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #ff7f3e22 0%, #ff3e3e22 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <LockOutlinedIcon sx={{ fontSize: 40, color: '#e53935' }} />
          </Box>

          <Typography variant="h5" fontWeight={700} color="text.primary">
            Access Restricted
          </Typography>

          <Typography variant="body1" color="text.secondary" lineHeight={1.7}>
            You do not have permission to access this campus. You can only
            access the campus you belong to.
          </Typography>

          {/* Navigate back to the campus list — or directly to the user's own campus */}
          <Button
            variant="contained"
            startIcon={<ArrowBackIcon />}
            onClick={() =>
              userCampusId
                ? navigate(`/campus/${userCampusId}`)
                : navigate('/allCampus')
            }
            sx={{
              mt: 1,
              borderRadius: 3,
              px: 4,
              py: 1.4,
              fontWeight: 600,
              textTransform: 'none',
              background: 'linear-gradient(135deg, #2a629a 0%, #4989c8 100%)',
              boxShadow: '0 4px 12px rgba(42,98,154,0.3)',
              '&:hover': {
                boxShadow: '0 6px 16px rgba(42,98,154,0.4)',
              },
            }}
          >
            {userCampusId ? 'Go to My Campus' : 'Back to Campus List'}
          </Button>
        </Stack>
      </Paper>
    </Box>
  );
}