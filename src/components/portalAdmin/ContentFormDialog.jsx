/**
 * @file ContentFormDialog.jsx
 * @description Reusable create/edit dialog for Phase 2 portal content resources.
 *
 * Driven by a `fields` config so testimonials / FAQ / course previews share one
 * form. Supported field types: text, number, textarea, bilingual ({fr,en}),
 * switch, select. Bilingual fields render a French (required) + English input.
 */

import { useFormik } from 'formik';
import {
  Alert, Dialog, DialogTitle, DialogContent, DialogActions,
  Button, TextField, FormControlLabel, Switch, Stack, Box,
  Typography, CircularProgress, MenuItem, IconButton, useMediaQuery,
} from '@mui/material';
import { Close } from '@mui/icons-material';
import { useTheme } from '@mui/material/styles';

function buildInitialValues(fields, init) {
  const v = {};
  for (const f of fields) {
    if (f.type === 'bilingual') {
      v[f.name] = { fr: init?.[f.name]?.fr ?? '', en: init?.[f.name]?.en ?? '' };
    } else if (f.type === 'switch') {
      v[f.name] = init?.[f.name] ?? f.default ?? false;
    } else {
      v[f.name] = init?.[f.name] ?? f.default ?? '';
    }
  }
  return v;
}

function validate(fields, values) {
  const errors = {};
  for (const f of fields) {
    if (!f.required) continue;
    if (f.type === 'bilingual') {
      if (!values[f.name]?.fr?.trim()) errors[f.name] = { fr: 'Required' };
    } else if (f.type !== 'switch' && (values[f.name] === '' || values[f.name] === undefined)) {
      errors[f.name] = 'Required';
    }
  }
  return errors;
}

function sanitize(fields, values) {
  const out = {};
  for (const f of fields) {
    const val = values[f.name];
    if (f.type === 'number') {
      out[f.name] = val === '' || val === null ? null : Number(val);
    } else if (f.type === 'bilingual') {
      out[f.name] = { fr: val.fr, en: val.en?.trim() ? val.en : null };
    } else {
      out[f.name] = val;
    }
  }
  return out;
}

export default function ContentFormDialog({
  open, onClose, onSubmit, initialValues, mode = 'create', title, fields,
}) {
  const theme    = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const formik = useFormik({
    initialValues: buildInitialValues(fields, initialValues),
    enableReinitialize: true,
    validate: (values) => validate(fields, values),
    onSubmit: async (values, { setSubmitting, setStatus }) => {
      try {
        await onSubmit(sanitize(fields, values));
        onClose();
      } catch (err) {
        setStatus({ error: err.response?.data?.message || 'Failed to save.' });
      } finally {
        setSubmitting(false);
      }
    },
  });

  const renderField = (f) => {
    const err = formik.touched[f.name] && formik.errors[f.name];

    switch (f.type) {
      case 'switch':
        return (
          <FormControlLabel
            key={f.name}
            control={
              <Switch
                checked={Boolean(formik.values[f.name])}
                onChange={(e) => formik.setFieldValue(f.name, e.target.checked)}
              />
            }
            label={f.label}
          />
        );

      case 'select':
        return (
          <TextField
            key={f.name}
            select fullWidth size="small"
            label={f.label}
            name={f.name}
            value={formik.values[f.name]}
            onChange={formik.handleChange}
          >
            {f.options.map((o) => (
              <MenuItem key={o.value} value={o.value}>{o.label}</MenuItem>
            ))}
          </TextField>
        );

      case 'bilingual':
        return (
          <Box key={f.name}>
            <Typography variant="caption" fontWeight={700} color="text.secondary">
              {f.label}{f.required ? ' *' : ''}
            </Typography>
            <Stack spacing={1.5} sx={{ mt: 0.5 }}>
              <TextField
                fullWidth size="small" label="Français"
                name={`${f.name}.fr`}
                value={formik.values[f.name].fr}
                onChange={formik.handleChange}
                error={Boolean(err?.fr)}
                helperText={err?.fr}
                multiline={f.multiline} minRows={f.multiline ? 3 : undefined}
              />
              <TextField
                fullWidth size="small" label="English"
                name={`${f.name}.en`}
                value={formik.values[f.name].en}
                onChange={formik.handleChange}
                multiline={f.multiline} minRows={f.multiline ? 3 : undefined}
              />
            </Stack>
          </Box>
        );

      default: // text, number, textarea
        return (
          <TextField
            key={f.name}
            fullWidth size="small"
            label={f.label + (f.required ? ' *' : '')}
            name={f.name}
            type={f.type === 'number' ? 'number' : 'text'}
            value={formik.values[f.name]}
            onChange={formik.handleChange}
            error={Boolean(err)}
            helperText={typeof err === 'string' ? err : undefined}
            multiline={f.type === 'textarea'} minRows={f.type === 'textarea' ? 4 : undefined}
            placeholder={f.placeholder}
          />
        );
    }
  };

  return (
    <Dialog
      open={open}
      onClose={formik.isSubmitting ? undefined : onClose}
      fullWidth maxWidth="sm" fullScreen={isMobile}
      slotProps={{ paper: { sx: { borderRadius: isMobile ? 0 : 3 } } }}
    >
      <DialogTitle sx={{ fontWeight: 700, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        {mode === 'edit' ? `Edit ${title}` : `New ${title}`}
        <IconButton onClick={onClose} size="small"><Close /></IconButton>
      </DialogTitle>

      <form onSubmit={formik.handleSubmit}>
        <DialogContent dividers>
          {formik.status?.error && (
            <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>{formik.status.error}</Alert>
          )}
          <Stack spacing={2}>
            {fields.map(renderField)}
          </Stack>
        </DialogContent>

        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button onClick={onClose} disabled={formik.isSubmitting} sx={{ textTransform: 'none' }}>
            Cancel
          </Button>
          <Button
            type="submit" variant="contained"
            disabled={formik.isSubmitting}
            startIcon={formik.isSubmitting ? <CircularProgress size={16} /> : null}
            sx={{ textTransform: 'none', borderRadius: 2, fontWeight: 700 }}
          >
            {mode === 'edit' ? 'Save' : 'Create'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}
