import { Box, Typography, Button } from '@mui/material';
import { Lock } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useStaffPermission } from '../../hooks/useStaffPermission';
import { useAppTranslation }  from '../../../hooks/useAppTranslation';

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
  const { t }    = useAppTranslation('staff');

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
        {t('staff:access.denied')}
      </Typography>
      <Typography variant="body2" sx={{ mb: 3, maxWidth: 340 }}>
        {t('staff:access.deniedMsg')}
      </Typography>
      <Button
        variant="outlined"
        onClick={() => navigate('/staff')}
        sx={{ textTransform: 'none', borderRadius: 2 }}
      >
        {t('staff:access.backToDashboard')}
      </Button>
    </Box>
  );
}
