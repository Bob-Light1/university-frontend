/**
 * Section heading + divider used inside form layouts.
 */

import { Divider, Grid, Typography } from '@mui/material';

const FormSection = ({ title, subtitle }) => (
  <Grid size={{ xs: 12 }} sx={{ mt: 1 }}>
    <Typography variant="overline" color="primary" fontWeight="bold" fontSize="0.875rem">
      {title}{' '}
      {subtitle && (
        <Typography component="span" variant="caption" color="text.secondary">
          {subtitle}
        </Typography>
      )}
    </Typography>
    <Divider sx={{ mt: 0.5, mb: 2 }} />
  </Grid>
);

export default FormSection;