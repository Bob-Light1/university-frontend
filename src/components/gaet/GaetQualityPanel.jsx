/**
 * @file GaetQualityPanel.jsx
 * @description Quality metrics panel for a generated GAET timetable.
 *
 * qualityReport shape (from backend):
 *   { score, hardConstraintsSatisfied, softConstraintsSatisfied,
 *     roomUtilizationPct, unplacedCourses[], generationDurationMs }
 */

import {
  Box, Grid, Card, CardContent, Typography, Stack, Alert,
  LinearProgress, Chip, Divider, alpha, useTheme,
} from '@mui/material';
import {
  EmojiEvents, Shield, Tune, MeetingRoom, Timer, BookmarkBorder,
} from '@mui/icons-material';
import { useTranslation } from 'react-i18next';

// ─── KPI CARD ────────────────────────────────────────────────────────────────

const MetricCard = ({ icon, label, value, sub, color, progress }) => {
  const theme = useTheme();
  return (
    <Card
      sx={{
        height: '100%',
        border: `1px solid ${alpha(color, 0.2)}`,
        background: alpha(color, 0.04),
        transition: 'transform 0.2s',
        '&:hover': { transform: 'translateY(-2px)', boxShadow: theme.shadows[4] },
      }}
    >
      <CardContent>
        <Stack spacing={1.5}>
          <Stack direction="row" alignItems="center" spacing={1}>
            <Box
              sx={{
                width: 40, height: 40, borderRadius: 2,
                bgcolor: alpha(color, 0.12),
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color,
              }}
            >
              {icon}
            </Box>
            <Typography variant="body2" color="text.secondary" fontWeight={500}>
              {label}
            </Typography>
          </Stack>

          <Typography variant="h4" fontWeight={800} sx={{ color }}>
            {value}
          </Typography>

          {sub && (
            <Typography variant="caption" color="text.secondary">
              {sub}
            </Typography>
          )}

          {progress !== undefined && (
            <Box>
              <LinearProgress
                variant="determinate"
                value={Math.min(100, Math.max(0, progress))}
                sx={{
                  height: 6, borderRadius: 1,
                  bgcolor: alpha(color, 0.12),
                  '& .MuiLinearProgress-bar': { bgcolor: color },
                }}
              />
            </Box>
          )}
        </Stack>
      </CardContent>
    </Card>
  );
};

// ─── UNPLACED COURSES LIST ────────────────────────────────────────────────────

const UnplacedCoursesList = ({ unplacedCourses, courseRequirements, subjectOptions, classOptions }) => {
  const { t } = useTranslation('gaet');
  const crMap = Object.fromEntries(
    (courseRequirements ?? []).map((cr) => [String(cr._id), cr])
  );

  if (!unplacedCourses?.length) return null;

  return (
    <Box mt={2}>
      <Typography variant="subtitle2" fontWeight={700} mb={1} color="warning.dark">
        {t('quality.unplacedTitle', { count: unplacedCourses.length })}
      </Typography>
      <Stack spacing={1}>
        {unplacedCourses.map((item, idx) => {
          const cr           = crMap[String(item.courseRequirementRef)];
          const subjectLabel = subjectOptions?.find((o) => o.value === String(cr?.subjectId ?? ''))?.label;
          const classLabel   = classOptions?.find((o) => o.value === String(cr?.classId ?? ''))?.label;
          const courseLabel  = subjectLabel
            ? `${subjectLabel}${classLabel ? ` — ${classLabel}` : ''}`
            : t('quality.unplacedRefFallback', { ref: String(item.courseRequirementRef).slice(-6) });
          return (
            <Box
              key={idx}
              sx={{
                p: 1.5, borderRadius: 2,
                bgcolor: alpha('#ed6c02', 0.06),
                border: '1px solid',
                borderColor: alpha('#ed6c02', 0.2),
              }}
            >
              <Stack direction="row" justifyContent="space-between" alignItems="flex-start" spacing={1}>
                <Stack spacing={0.25}>
                  <Typography variant="body2" fontWeight={600}>
                    {courseLabel}
                  </Typography>
                  {item.reason && (
                    <Typography variant="caption" color="text.secondary">
                      {item.reason}
                    </Typography>
                  )}
                </Stack>
                <Chip label={t('quality.unplacedLabel')} color="warning" size="small" variant="outlined" />
              </Stack>
            </Box>
          );
        })}
      </Stack>
    </Box>
  );
};

// ─── MAIN COMPONENT ──────────────────────────────────────────────────────────

const GaetQualityPanel = ({ report, status, courseRequirements, subjectOptions, classOptions }) => {
  const theme = useTheme();
  const { t } = useTranslation('gaet');

  if (!report) return null;

  const isPartial = status === 'PARTIALLY_GENERATED';
  const score     = report.score ?? 0;

  // Score color: green ≥ 800, orange ≥ 600, red < 600
  const scoreColor =
    score >= 800 ? theme.palette.success.main :
    score >= 600 ? theme.palette.warning.main :
                   theme.palette.error.main;

  const metrics = [
    {
      icon:     <EmojiEvents />,
      label:    t('quality.score'),
      value:    t('quality.scoreValue', { score }),
      sub:      score >= 800 ? t('quality.scoreExcellent') : score >= 600 ? t('quality.scoreGood') : t('quality.scoreNeedsReview'),
      color:    scoreColor,
      progress: score / 10,
    },
    {
      icon:     <Shield />,
      label:    t('quality.hardConstraints'),
      value:    `${report.hardConstraintsSatisfied ?? 0}%`,
      sub:      t('quality.hardConstraintsSub'),
      color:    theme.palette.primary.main,
      progress: report.hardConstraintsSatisfied ?? 0,
    },
    {
      icon:     <Tune />,
      label:    t('quality.softConstraints'),
      value:    `${report.softConstraintsSatisfied ?? 0}%`,
      sub:      t('quality.softConstraintsSub'),
      color:    theme.palette.info.main,
      progress: report.softConstraintsSatisfied ?? 0,
    },
    {
      icon:     <MeetingRoom />,
      label:    t('quality.roomUtilization'),
      value:    `${report.roomUtilizationPct ?? 0}%`,
      sub:      t('quality.roomUtilizationSub'),
      color:    theme.palette.secondary.main,
      progress: report.roomUtilizationPct ?? 0,
    },
  ];

  return (
    <Box>
      {/* Partial generation warning */}
      {isPartial && (
        <Alert severity="warning" sx={{ mb: 3, borderRadius: 2 }}>
          <Typography variant="body2" fontWeight={600}>
            {t('quality.partialTitle', { count: report.unplacedCourses?.length ?? 0 })}
          </Typography>
          <Typography variant="caption">
            {t('quality.partialBody')}
          </Typography>
        </Alert>
      )}

      {/* KPI Grid */}
      <Grid container spacing={2}>
        {metrics.map((m, i) => (
          <Grid key={i} size={{ xs: 12, sm: 6, md: 3 }}>
            <MetricCard {...m} />
          </Grid>
        ))}
      </Grid>

      {/* Generation duration */}
      {report.generationDurationMs !== undefined && (
        <Box mt={2}>
          <Stack direction="row" alignItems="center" spacing={1}>
            <Timer sx={{ fontSize: 18, color: 'text.secondary' }} />
            <Typography variant="body2" color="text.secondary">
              {t('quality.generatedIn', { seconds: (report.generationDurationMs / 1000).toFixed(2) })}
            </Typography>
          </Stack>
        </Box>
      )}

      {/* Unplaced courses */}
      {report.unplacedCourses?.length > 0 && (
        <>
          <Divider sx={{ my: 3 }} />
          <UnplacedCoursesList
            unplacedCourses={report.unplacedCourses}
            courseRequirements={courseRequirements}
            subjectOptions={subjectOptions}
            classOptions={classOptions}
          />
        </>
      )}

      {/* No issues */}
      {!isPartial && !report.unplacedCourses?.length && (
        <Alert severity="success" icon={<BookmarkBorder />} sx={{ mt: 2, borderRadius: 2 }}>
          {t('quality.allPlaced')}
        </Alert>
      )}
    </Box>
  );
};

export default GaetQualityPanel;
