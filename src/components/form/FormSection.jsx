/**
 * Section heading + divider used inside form layouts.
 *
 * Used in two patterns:
 *  1. Standalone divider (no children) — inside a Grid container, acts as a
 *     full-width row separator (TeacherForm, StudentForm, ParentForm…).
 *  2. Wrapper with children — inside a Stack, wraps a group of fields with a
 *     titled section header (PartnerForm).
 *
 * Both patterns are supported and backward-compatible.
 * The `icon` and `collapsible` props are consumed without side-effects when
 * not applicable.
 */

import { Box, Divider, Grid, Stack, Typography } from '@mui/material';

const FormSection = ({ title, subtitle, icon, children, collapsible: _collapsible }) => (
  <Grid size={{ xs: 12 }} sx={{ mt: 1 }}>
    <Stack direction="row" spacing={0.75} alignItems="center">
      {icon && (
        <Box sx={{ color: 'text.secondary', display: 'flex', alignItems: 'center' }}>
          {icon}
        </Box>
      )}
      <Typography variant="overline" color="primary" fontWeight="bold" fontSize="0.875rem">
        {title}
        {subtitle && (
          <Typography component="span" variant="caption" color="text.secondary">
            {' '}{subtitle}
          </Typography>
        )}
      </Typography>
    </Stack>
    <Divider sx={{ mt: 0.5, mb: children ? 2 : 0 }} />
    {children}
  </Grid>
);

export default FormSection;