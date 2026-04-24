import { Box, Grid, Paper, Skeleton, Stack } from '@mui/material';

const KpiSkeleton = () => (
  <Paper elevation={2} sx={{ p: 2.5, borderRadius: 3, height: '100%' }}>
    <Stack direction="row" spacing={2} alignItems="flex-start">
      <Skeleton variant="rounded" width={48} height={48} sx={{ flexShrink: 0 }} />
      <Box sx={{ flex: 1 }}>
        <Skeleton width="50%" height={14} sx={{ mb: 0.5 }} />
        <Skeleton width="70%" height={32} sx={{ mb: 0.5 }} />
        <Skeleton width="60%" height={12} />
      </Box>
    </Stack>
  </Paper>
);

const SessionSkeleton = () => (
  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, py: 1.5, px: 2, borderRadius: 2, bgcolor: 'action.hover' }}>
    <Skeleton variant="text" width={48} height={36} />
    <Box sx={{ flex: 1 }}>
      <Skeleton width="55%" height={16} sx={{ mb: 0.5 }} />
      <Skeleton width="40%" height={12} />
    </Box>
    <Skeleton variant="rounded" width={80} height={24} />
  </Box>
);

export default function TeacherDashboardSkeleton() {
  return (
    <Box sx={{ p: { xs: 1.5, sm: 2, md: 3 }, maxWidth: 1200, mx: 'auto' }}>

      {/* Hero */}
      <Paper elevation={3} sx={{ borderRadius: 4, overflow: 'hidden', mb: 3, p: 3 }}>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={3} alignItems={{ xs: 'flex-start', sm: 'center' }}>
          <Skeleton variant="circular" width={80} height={80} sx={{ flexShrink: 0 }} />
          <Box sx={{ flex: 1 }}>
            <Skeleton width="45%" height={28} sx={{ mb: 0.5 }} />
            <Skeleton width="35%" height={16} sx={{ mb: 1 }} />
            <Stack direction="row" spacing={1} flexWrap="wrap">
              <Skeleton variant="rounded" width={80}  height={24} />
              <Skeleton variant="rounded" width={90}  height={24} />
              <Skeleton variant="rounded" width={110} height={24} />
            </Stack>
          </Box>
          <Box sx={{ minWidth: 120 }}>
            <Skeleton width="60%" height={14} sx={{ mb: 0.5 }} />
            <Skeleton width="80%" height={24} />
          </Box>
        </Stack>
        <Box sx={{ mt: 2 }}>
          <Skeleton width="100%" height={8} sx={{ borderRadius: 4 }} />
        </Box>
      </Paper>

      {/* KPI strip */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        {[0, 1, 2, 3].map((i) => (
          <Grid key={i} size={{ xs: 12, sm: 6, lg: 3 }}>
            <KpiSkeleton />
          </Grid>
        ))}
      </Grid>

      <Grid container spacing={3}>
        {/* Today's schedule */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Paper elevation={2} sx={{ borderRadius: 3, p: 2.5 }}>
            <Skeleton width="40%" height={24} sx={{ mb: 2 }} />
            <Stack spacing={1}>
              {[0, 1, 2].map((i) => <SessionSkeleton key={i} />)}
            </Stack>
          </Paper>
        </Grid>

        {/* Upcoming */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Paper elevation={2} sx={{ borderRadius: 3, p: 2.5 }}>
            <Skeleton width="45%" height={24} sx={{ mb: 2 }} />
            <Stack spacing={1}>
              {[0, 1, 2].map((i) => <SessionSkeleton key={i} />)}
            </Stack>
          </Paper>
        </Grid>

        {/* Subjects & classes */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Paper elevation={2} sx={{ borderRadius: 3, p: 2.5 }}>
            <Skeleton width="35%" height={24} sx={{ mb: 2 }} />
            <Stack direction="row" flexWrap="wrap" gap={1} sx={{ mb: 2 }}>
              {[80, 110, 95, 70].map((w, i) => (
                <Skeleton key={i} variant="rounded" width={w} height={30} />
              ))}
            </Stack>
            <Skeleton width="30%" height={18} sx={{ mb: 1.5 }} />
            <Stack direction="row" flexWrap="wrap" gap={1}>
              {[70, 85, 90].map((w, i) => (
                <Skeleton key={i} variant="rounded" width={w} height={26} />
              ))}
            </Stack>
          </Paper>
        </Grid>

        {/* Quick links */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Paper elevation={2} sx={{ borderRadius: 3, p: 2.5 }}>
            <Skeleton width="30%" height={24} sx={{ mb: 2 }} />
            <Grid container spacing={1.5}>
              {[0, 1, 2, 3, 4, 5].map((i) => (
                <Grid key={i} size={{ xs: 4 }}>
                  <Paper elevation={1} sx={{ borderRadius: 3, p: 2 }}>
                    <Stack spacing={1} alignItems="center">
                      <Skeleton variant="rounded" width={48} height={48} />
                      <Skeleton width="70%" height={14} />
                    </Stack>
                  </Paper>
                </Grid>
              ))}
            </Grid>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
}
