import React from 'react';
import { 
  Grid, Card, CardContent, Typography, Box, Stack, Avatar,
  LinearProgress, Skeleton, useTheme, alpha
} from '@mui/material';
import {
  TrendingUp,
  TrendingDown,
  Remove as RemoveIcon
} from '@mui/icons-material';

/**
 * REUSABLE KPI CARDS COMPONENT
 * @param {Array} metrics - Array of metric objects
 * @param {Boolean} loading - Show skeleton loaders
 */

const KPICards = ({ metrics = [], loading = false }) => {
  const theme = useTheme();

  if (!Array.isArray(metrics)) {
    console.warn('[KPICards] metrics prop must be an array');
    return null;
  }

  if (loading) {
    return (
      <Grid container spacing={3}>
        {[1, 2, 3, 4].map((item) => (
          <Grid size = {{ xs: 12, sm: 6, md: 3}} key={item}>
            <Card sx={{ height: '100%' }}>
              <CardContent>
                <Skeleton variant="circular" width={56} height={56} />
                <Skeleton variant="text" sx={{ mt: 2 }} />
                <Skeleton variant="text" width="60%" />
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    );
  }

  return (
    <Grid container spacing={3}>
      {metrics.map((metric, index) => (
        <Grid size = {{ xs: 12, sm: 6, md: 3}} key={metric.key || index}>
          <Card
            sx={{
              height: '100%',
              position: 'relative',
              overflow: 'visible',
              transition: 'all 0.3s ease',
              '&:hover': {
                transform: 'translateY(-4px)',
                boxShadow: theme.shadows[8],
              },
            }}
          >
            <CardContent>
              <Stack spacing={2}>
                {/* Icon and Title */}
                <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
                  <Avatar
                    sx={{
                      bgcolor: alpha(metric.color || theme.palette.primary.main, 0.1),
                      color: metric.color || theme.palette.primary.main,
                      width: 56,
                      height: 56,
                    }}
                  >
                    {metric.icon}
                  </Avatar>

                  {/* Trend Indicator */}
                  {metric.trend !== undefined && metric.trend !== null && (
                    <Box
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 0.5,
                        px: 1,
                        py: 0.5,
                        borderRadius: 1,
                        bgcolor: alpha(
                          metric.trend > 0
                            ? theme.palette.success.main
                            : metric.trend < 0
                            ? theme.palette.error.main
                            : theme.palette.grey[500],
                          0.1
                        ),
                      }}
                    >
                      {metric.trend > 0 ? (
                        <TrendingUp sx={{ fontSize: 16, color: 'success.main' }} />
                      ) : metric.trend < 0 ? (
                        <TrendingDown sx={{ fontSize: 16, color: 'error.main' }} />
                      ) : (
                        <RemoveIcon sx={{ fontSize: 16, color: 'text.disabled' }} />
                      )}
                      <Typography
                        variant="caption"
                        fontWeight={600}
                        sx={{
                          color:
                            metric.trend > 0
                              ? 'success.main'
                              : metric.trend < 0
                              ? 'error.main'
                              : 'text.disabled',
                        }}
                      >
                        {Math.abs(metric.trend)}%
                      </Typography>
                    </Box>
                  )}
                </Stack>

                {/* Value */}
                <Box>
                  <Typography variant="h3" fontWeight={700} sx={{ mb: 0.5 }}>
                    {metric.value ?? 'N/A'}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" fontWeight={500}>
                    {metric.label || 'Metric'}
                  </Typography>
                </Box>

                {/* Optional Subtitle/Description */}
                {metric.subtitle && (
                  <Typography variant="caption" color="text.secondary">
                    {metric.subtitle}
                  </Typography>
                )}

                {/* Optional Progress Bar */}
                {metric.progress !== undefined && (
                  <Box>
                    <Stack direction="row" justifyContent="space-between" mb={0.5}>
                      <Typography variant="caption" color="text.secondary">
                        {metric.progressLabel || 'Progress'}
                      </Typography>
                      <Typography variant="caption" fontWeight={600}>
                        {metric.progress}%
                      </Typography>
                    </Stack>
                    <LinearProgress
                      variant="determinate"
                      value={metric.progress}
                      sx={{
                        height: 6,
                        borderRadius: 1,
                        bgcolor: alpha(metric.color || theme.palette.primary.main, 0.1),
                        '& .MuiLinearProgress-bar': {
                          bgcolor: metric.color || theme.palette.primary.main,
                        },
                      }}
                    />
                  </Box>
                )}

                {/* Optional Alert Badge */}
                {metric.alert && (
                  <Box
                    sx={{
                      position: 'absolute',
                      top: -8,
                      right: -8,
                      bgcolor: 'error.main',
                      color: 'white',
                      borderRadius: '50%',
                      width: 24,
                      height: 24,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      boxShadow: theme.shadows[4],
                    }}
                  >
                    {metric.alert}
                  </Box>
                )}
              </Stack>
            </CardContent>
          </Card>
        </Grid>
      ))}
    </Grid>
  );
};

export default KPICards;