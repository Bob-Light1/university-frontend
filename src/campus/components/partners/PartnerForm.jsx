/**
 * @file PartnerForm.jsx
 * @description Create / Edit partner dialog — Formik + Yup, conditional sections by partnerType.
 *
 * @param {boolean}  open
 * @param {Object|null} partner  - null → create mode; document → edit mode
 * @param {Function} onClose
 * @param {Function} onSuccess   - Called with the saved partner after success
 */

import { useEffect, useMemo } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Button, Grid, Stack, Typography, CircularProgress,
  ToggleButtonGroup, ToggleButton,
  Snackbar, Alert,
} from '@mui/material';
import {
  Business, Person, School, Handshake,
  EmojiEvents, AccountTree,
} from '@mui/icons-material';
import { useFormik } from 'formik';
import * as Yup from 'yup';

import { registerPartner, updatePartner } from '../../../services/partnerService';
import { BRAND_ORANGE, BRAND_GRADIENT_BTN } from '../../../theme/partnerTokens';
import FormSection    from '../../../components/form/FormSection';
import {
  FormTextField, FormSelectField, FormPasswordField,
} from '../../../components/form/FormFields';
import useFormSnackbar from '../../../hooks/useFormSnackBar';

// ─── Option lists ─────────────────────────────────────────────────────────────

const INSTITUTION_TYPES = [
  { value: 'university',      label: 'University'      },
  { value: 'school',          label: 'School'          },
  { value: 'training_center', label: 'Training Center' },
  { value: 'ngo',             label: 'NGO'             },
  { value: 'government',      label: 'Government'      },
  { value: 'other',           label: 'Other'           },
];

const COMMERCIAL_TYPES = [
  { value: 'individual',  label: 'Individual'  },
  { value: 'agency',      label: 'Agency'      },
  { value: 'company',     label: 'Company'     },
  { value: 'influencer',  label: 'Influencer'  },
  { value: 'other',       label: 'Other'       },
];

const CHANNEL_TYPES = [
  { value: 'online',  label: 'Online'  },
  { value: 'offline', label: 'Offline' },
  { value: 'both',    label: 'Both'    },
];

const TIER_OPTIONS = [
  { value: 'bronze',   label: 'Bronze'   },
  { value: 'silver',   label: 'Silver'   },
  { value: 'gold',     label: 'Gold'     },
  { value: 'platinum', label: 'Platinum' },
];

const GENDER_OPTIONS = [
  { value: 'male',   label: 'Male'   },
  { value: 'female', label: 'Female' },
];

const COMMISSION_TYPE_OPTIONS = [
  { value: 'FIXED',      label: 'Fixed Amount' },
  { value: 'PERCENTAGE', label: 'Percentage'   },
];

const CURRENCY_OPTIONS = [
  { value: 'XAF', label: 'XAF' },
  { value: 'EUR', label: 'EUR' },
  { value: 'USD', label: 'USD' },
];

// ─── Yup schema ───────────────────────────────────────────────────────────────

const buildSchema = (isEdit) => Yup.object({
  firstName:       Yup.string().trim().min(2).max(50).required('First name is required'),
  lastName:        Yup.string().trim().min(2).max(50).required('Last name is required'),
  email:           Yup.string().email('Invalid email').required('Email is required'),
  password:        isEdit
    ? Yup.string().notRequired()
    : Yup.string().min(8, 'At least 8 characters').required('Password is required'),
  partnerType:     Yup.string().oneOf(['institutional', 'commercial']).required('Partner type is required'),
  institutionType: Yup.string().when('partnerType', {
    is:        'institutional',
    then:      (s) => s.required('Institution type is required'),
    otherwise: (s) => s.notRequired(),
  }),
  commercialType:  Yup.string().when('partnerType', {
    is:        'commercial',
    then:      (s) => s.required('Commercial type is required'),
    otherwise: (s) => s.notRequired(),
  }),
  channelType:    Yup.string().notRequired(),
  phone:          Yup.string()
    .matches(/^[+\d\s\-()/]{7,20}$/, 'Invalid phone number')
    .notRequired()
    .nullable(),
  bio:            Yup.string().max(500).notRequired(),
  tier:           Yup.string().oneOf(['bronze', 'silver', 'gold', 'platinum']).notRequired(),
  organization:   Yup.string().max(100).notRequired(),
  gender:         Yup.string().oneOf(['male', 'female', '']).notRequired(),
});

// ─── Initial values ───────────────────────────────────────────────────────────

const buildInitialValues = (partner) => ({
  firstName:       partner?.firstName       ?? '',
  lastName:        partner?.lastName        ?? '',
  email:           partner?.email           ?? '',
  password:        '',
  partnerType:     partner?.partnerType     ?? 'institutional',
  institutionType: partner?.institutionType ?? '',
  commercialType:  partner?.commercialType  ?? '',
  channelType:     partner?.channelType     ?? '',
  phone:           partner?.phone           ?? '',
  bio:             partner?.bio             ?? '',
  tier:            partner?.tier            ?? 'bronze',
  organization:    partner?.organization    ?? '',
  gender:          partner?.gender          ?? '',
  convention: {
    startDate:       partner?.convention?.startDate?.slice(0, 10) ?? '',
    endDate:         partner?.convention?.endDate?.slice(0, 10)   ?? '',
    commissionType:  partner?.convention?.commissionType          ?? '',
    commissionValue: partner?.convention?.commissionValue         ?? '',
    currency:        partner?.convention?.currency                ?? 'XAF',
    notes:           partner?.convention?.notes                   ?? '',
  },
});

// ─── Component ────────────────────────────────────────────────────────────────

const PartnerForm = ({ open, partner, onClose, onSuccess }) => {
  const isEdit = Boolean(partner?._id);
  const { snackbar, showSnackbar, closeSnackbar } = useFormSnackbar();

  const handleClose = () => {
    document.activeElement?.blur();
    onClose();
  };

  const schema = useMemo(() => buildSchema(isEdit), [isEdit]);

  const formik = useFormik({
    initialValues:    buildInitialValues(partner),
    validationSchema: schema,
    validateOnBlur:   true,
    enableReinitialize: true,
    onSubmit: async (values, { setSubmitting, resetForm }) => {
      try {
        const payload = { ...values };
        if (isEdit && !payload.password) delete payload.password;
        const conv = payload.convention;
        if (!conv.startDate && !conv.endDate && !conv.commissionType) {
          delete payload.convention;
        }
        const res = isEdit
          ? await updatePartner(partner._id, payload)
          : await registerPartner(payload);
        showSnackbar(
          isEdit ? 'Partner updated successfully.' : 'Partner created successfully.',
          'success',
        );
        resetForm();
        onSuccess?.(res.data?.data ?? res.data);
        handleClose();
      } catch (err) {
        showSnackbar(err.response?.data?.message || 'Failed to save partner.', 'error');
      } finally {
        setSubmitting(false);
      }
    },
  });

  useEffect(() => {
    if (!open) formik.resetForm();
  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps

  const pt = formik.values.partnerType;

  // Proxy for convention nested fields — keeps handleChange/handleBlur on the
  // real formik so dot-notation paths (e.g. "convention.startDate") are resolved.
  const convFormik = {
    values:       formik.values.convention,
    errors:       formik.errors.convention  ?? {},
    touched:      formik.touched.convention ?? {},
    handleChange: (e) => formik.setFieldValue(`convention.${e.target.name}`, e.target.value),
    handleBlur:   (e) => formik.setFieldTouched(`convention.${e.target.name}`, true),
  };

  return (
    <>
      {/*
        disableRestoreFocus prevents MUI from moving focus back to the trigger
        element (which is inside #root, still aria-hidden during close animation).
      */}
      <Dialog
        open={open}
        onClose={handleClose}
        maxWidth="md"
        fullWidth
        scroll="paper"
        disableRestoreFocus
        PaperProps={{ sx: { borderRadius: 3 } }}
      >
        <DialogTitle sx={{ borderBottom: 1, borderColor: 'divider', pb: 1.5 }}>
          <Stack direction="row" alignItems="center" spacing={1}>
            <Handshake sx={{ color: BRAND_ORANGE }} />
            <Typography variant="h6" fontWeight={700}>
              {isEdit ? 'Edit Partner' : 'Create New Partner'}
            </Typography>
          </Stack>
        </DialogTitle>

        <DialogContent sx={{ py: 3 }}>
          <form id="partner-form" onSubmit={formik.handleSubmit} noValidate>
            <Grid container spacing={3}>

              {/* ── Identity ────────────────────────────────────────────────── */}
              <FormSection title="Identity" icon={<Person color="action" />}>
                <Stack spacing={2}>
                  <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                    <FormTextField formik={formik} name="firstName" label="First Name" />
                    <FormTextField formik={formik} name="lastName"  label="Last Name"  />
                  </Stack>
                  <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                    <FormTextField formik={formik} name="email" label="Email Address" type="email" />
                    <FormTextField formik={formik} name="phone" label="Phone (optional)" />
                  </Stack>
                  <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                    <FormTextField   formik={formik} name="organization" label="Organization (optional)" />
                    <FormSelectField formik={formik} name="gender"       label="Gender (optional)"       options={GENDER_OPTIONS} />
                  </Stack>
                  <FormTextField
                    formik={formik}
                    name="bio"
                    label="Bio (optional)"
                    multiline
                    rows={3}
                    placeholder="Short description, max 500 characters…"
                  />
                </Stack>
              </FormSection>

              {/* ── Partner Type ─────────────────────────────────────────────── */}
              <FormSection title="Partner Type" icon={<AccountTree color="action" />}>
                <Stack spacing={2}>
                  <Stack spacing={0.5}>
                    <Typography variant="caption" color="text.secondary" fontWeight={600}>
                      Select type *
                    </Typography>
                    <ToggleButtonGroup
                      exclusive
                      value={formik.values.partnerType}
                      onChange={(_, v) => {
                        if (v) {
                          formik.setFieldValue('partnerType', v);
                          formik.setFieldValue('institutionType', '');
                          formik.setFieldValue('commercialType', '');
                        }
                      }}
                      size="small"
                    >
                      <ToggleButton value="institutional" sx={{ textTransform: 'none', px: 2.5 }}>
                        <School sx={{ mr: 1, fontSize: 18 }} /> Institutional
                      </ToggleButton>
                      <ToggleButton value="commercial" sx={{ textTransform: 'none', px: 2.5 }}>
                        <Business sx={{ mr: 1, fontSize: 18 }} /> Commercial
                      </ToggleButton>
                    </ToggleButtonGroup>
                    {formik.touched.partnerType && formik.errors.partnerType && (
                      <Typography variant="caption" color="error">{formik.errors.partnerType}</Typography>
                    )}
                  </Stack>

                  <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                    {pt === 'institutional' && (
                      <FormSelectField
                        formik={formik}
                        name="institutionType"
                        label="Institution Type *"
                        options={INSTITUTION_TYPES}
                      />
                    )}
                    {pt === 'commercial' && (
                      <FormSelectField
                        formik={formik}
                        name="commercialType"
                        label="Commercial Type *"
                        options={COMMERCIAL_TYPES}
                      />
                    )}
                    <FormSelectField formik={formik} name="channelType" label="Channel" options={CHANNEL_TYPES} />
                  </Stack>
                </Stack>
              </FormSection>

              {/* ── Tier & Access ────────────────────────────────────────────── */}
              <FormSection title="Tier & Access" icon={<EmojiEvents color="action" />}>
                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                  <FormSelectField formik={formik} name="tier" label="Tier" options={TIER_OPTIONS} />
                  {!isEdit && (
                    <FormPasswordField formik={formik} name="password" label="Temporary Password *" />
                  )}
                </Stack>
              </FormSection>

              {/* ── Convention (optional) ────────────────────────────────────── */}
              <FormSection title="Convention (optional)" icon={<Handshake color="action" />} collapsible>
                <Stack spacing={2}>
                  <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                    <FormTextField formik={convFormik} name="startDate" label="Start Date" type="date" />
                    <FormTextField formik={convFormik} name="endDate"   label="End Date"   type="date" />
                  </Stack>
                  <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                    <FormSelectField formik={convFormik} name="commissionType"  label="Commission Type"    options={COMMISSION_TYPE_OPTIONS} />
                    <FormTextField   formik={convFormik} name="commissionValue" label="Value (amount or %)" type="number" />
                    <FormSelectField formik={convFormik} name="currency"        label="Currency"            options={CURRENCY_OPTIONS} />
                  </Stack>
                  <FormTextField formik={convFormik} name="notes" label="Notes" multiline rows={2} />
                </Stack>
              </FormSection>

            </Grid>
          </form>
        </DialogContent>

        <DialogActions sx={{ px: 3, py: 2, borderTop: 1, borderColor: 'divider' }}>
          <Button onClick={handleClose} sx={{ textTransform: 'none' }}>Cancel</Button>
          <Button
            form="partner-form"
            type="submit"
            variant="contained"
            disabled={formik.isSubmitting}
            startIcon={formik.isSubmitting ? <CircularProgress size={16} color="inherit" /> : null}
            sx={{
              textTransform: 'none', fontWeight: 700, borderRadius: 2,
              background: BRAND_GRADIENT_BTN,
            }}
          >
            {formik.isSubmitting ? 'Saving…' : isEdit ? 'Save Changes' : 'Create Partner'}
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={closeSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert severity={snackbar.severity} variant="filled" onClose={closeSnackbar} sx={{ borderRadius: 2 }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </>
  );
};

export default PartnerForm;
