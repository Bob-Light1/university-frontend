import { Box, Typography, Button } from '@mui/material';
import { Lock } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useStaffPermission } from '../../hooks/useStaffPermission';

/**
 * Renders children only if the user has the required permission.
 * Otherwise shows an "Access denied" card.
 *
 * @param {string}   permission   - Single permission key required
 * @param {string[]} anyOf        - Alternative: at least one of these keys
 * @param {node}     children
 */
export default function PermissionGate({ permission, anyOf, children }) {
  const { has, hasAny } = useStaffPermission();
  const navigate = useNavigate();

  const allowed = permission
    ? has(permission)
    : anyOf
      ? hasAny(anyOf)
      : true;

  if (allowed) return children;

  return (
    <Box
      sx={{
        display:        'flex',
        flexDirection:  'column',
        alignItems:     'center',
        justifyContent: 'center',
        py:             10,
        textAlign:      'center',
        color:          'text.secondary',
      }}
    >
      <Lock sx={{ fontSize: 56, mb: 2, color: 'text.disabled' }} />
      <Typography variant="h6" fontWeight={700} gutterBottom>
        Access Denied
      </Typography>
      <Typography variant="body2" sx={{ mb: 3, maxWidth: 340 }}>
        Your current role does not include the permission required to view this module.
        Contact your campus administrator to request access.
      </Typography>
      <Button
        variant="outlined"
        onClick={() => navigate('/staff')}
        sx={{ textTransform: 'none', borderRadius: 2 }}
      >
        Back to Dashboard
      </Button>
    </Box>
  );
}
