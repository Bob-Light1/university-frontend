import { Button, CircularProgress, Grid, Stack, Typography, Box } from '@mui/material';
import { CalendarMonth, Check, Cancel, Info } from '@mui/icons-material';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { FormTextField } from '../../../components/form/FormFields';
import { fDateWeekday } from '../../../utils/dateFormat';

/**
 * Teacher postponement request form.
 * Aligned with POST /schedules/teacher/:id/postpone backend contract:
 *   { reason: string (min 10 chars), proposedStart?: ISO, proposedEnd?: ISO }
 *
 * FIX: original form sent { requestedDate, reason } which does not match
 *      the backend's { reason, proposedStart, proposedEnd } shape.
 *      The backend requires TWO date bounds, not one date.
 */

// Inline schema — avoids dependency on a separate schema file that was
// validating the wrong fields (requestedDate instead of reason + date range).
const postponementSchema = Yup.object({
  reason: Yup.string()
    .min(10, 'Please provide a reason of at least 10 characters.')
    .required('Reason is required.'),
  proposedStart: Yup.string()
    .test(
      'valid-date',
      'Invalid date',
      (v) => !v || !isNaN(Date.parse(v))
    ),
  proposedEnd: Yup.string()
    .test(
      'valid-date',
      'Invalid date',
      (v) => !v || !isNaN(Date.parse(v))
    )
    .test(
      'after-start',
      'End must be after start',
      function (endVal) {
        const { proposedStart } = this.parent;
        if (!proposedStart || !endVal) return true;
        return new Date(endVal) > new Date(proposedStart);
      }
    ),
});

const PostponementForm = ({ session, onSubmit, onCancel }) => {
  const formik = useFormik({
    initialValues: { reason: '', proposedStart: '', proposedEnd: '' },
    validationSchema: postponementSchema,
    onSubmit: async (values) => {
      // Shape matches backend requestPostponement controller exactly
      const payload = {
        reason: values.reason.trim(),
        ...(values.proposedStart && {
          proposedStart: new Date(values.proposedStart).toISOString(),
        }),
        ...(values.proposedEnd && {
          proposedEnd: new Date(values.proposedEnd).toISOString(),
        }),
      };
      await onSubmit(payload);
    },
  });

  return (
    <form onSubmit={formik.handleSubmit} noValidate>
      <Grid container spacing={2.5}>

        {/* Session summary */}
        {session && (
          <Grid size={{ xs: 12 }}>
            <Box sx={{ p: 1.5, bgcolor: 'action.hover', borderRadius: 2 }}>
              <Stack direction="row" spacing={1} alignItems="center">
                <Info fontSize="small" color="info" />
                <Typography variant="body2" fontWeight={600}>
                  {session.subject?.subject_name}
                  {session.startTime && ` — ${fDateWeekday(session.startTime)}`}
                </Typography>
              </Stack>
            </Box>
          </Grid>
        )}

        {/* Reason — required, min 10 chars (mirrors backend validation) */}
        <Grid size={{ xs: 12 }}>
          <FormTextField
            formik={formik}
            name="reason"
            label="Reason for postponement (required, min. 10 characters)"
            multiline
            rows={4}
          />
        </Grid>

        {/* Proposed new time slot — optional but both bounds must be provided together */}
        <Grid size={{ xs: 12, sm: 6 }}>
          <FormTextField
            formik={formik}
            name="proposedStart"
            label="Proposed start (optional)"
            type="datetime-local"
            icon={CalendarMonth}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6 }}>
          <FormTextField
            formik={formik}
            name="proposedEnd"
            label="Proposed end (optional)"
            type="datetime-local"
            icon={CalendarMonth}
          />
        </Grid>

        <Grid size={{ xs: 12 }}>
          <Stack direction="row" spacing={2} justifyContent="flex-end">
            <Button
              variant="outlined"
              startIcon={<Cancel />}
              onClick={onCancel}
              disabled={formik.isSubmitting}
              sx={{ textTransform: 'none', borderRadius: 2 }}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="contained"
              startIcon={
                formik.isSubmitting
                  ? <CircularProgress size={18} color="inherit" />
                  : <Check />
              }
              disabled={formik.isSubmitting || !formik.isValid || !formik.dirty}
              sx={{ textTransform: 'none', borderRadius: 2 }}
            >
              {formik.isSubmitting ? 'Submitting…' : 'Submit Request'}
            </Button>
          </Stack>
        </Grid>

      </Grid>
    </form>
  );
};

export default PostponementForm;