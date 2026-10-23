/** @file LeadDetailDrawer.jsx @description Private dossier preparation, director admission and pending-student enrollment. */
import { useEffect, useState } from 'react';
import { useFormik } from 'formik';
import {
  Box, Stack, Typography, Button, IconButton, Divider, Alert, TextField,
  FormControl, InputLabel, Select, MenuItem, List, ListItem, ListItemText, CircularProgress,
} from '@mui/material';
import { Close, Download, Archive } from '@mui/icons-material';
import { useAuth } from '../../../hooks/useAuth';
import { useFeature } from '../../../hooks/useFeature';
import { useAppTranslation } from '../../../hooks/useAppTranslation';
import useAdmissionDossier from '../../../hooks/useAdmissionDossier';
import useRelatedData from '../../../hooks/useRelatedData';
import useHardDelete from '../../../hooks/useHardDelete';
import HardDeleteAction from '../../../components/shared/HardDeleteAction';
import HardDeleteDialog from '../../../components/shared/HardDeleteDialog';
import ActivationResultDialog from '../common/ActivationResultDialog';
import { resendActivation } from '../../../services/accountService';
import {
  updateLeadStatus, uploadDossierFile, downloadDossierFile, archiveDossierFile,
  issueDossierAccess, revokeDossierAccess, getAdmissionConfig, setAdmissionConfig,
} from '../../../services/leadService';
import { TRANSITIONS, ADMISSION_ROLES, LEAD_STATUS, DRAFT_STATUSES, ATTACHMENT_CATEGORIES, ADMISSION_ERRORS } from '../../../config/admissionConstants';
import { admissionEnrollmentSchema } from '../../../yupSchema/admissionEnrollmentSchema';
import { saveBlobResponse } from '../../../utils/downloadBlob';
import { fDateTime } from '../../../utils/dateFormat';

const RELATED = { classes: (id) => `/campus/${id}/classes` };

/** Render management-only controls; candidate and partner access have distinct server contracts. */
export default function LeadDetailDrawer({ lead, onClose, onUpdated }) {
  const { t } = useAppTranslation('common');
  const { user } = useAuth();
  const feature = useFeature('partner');
  const { data, busy, error, run, refresh } = useAdmissionDossier(lead._id);
  const current = data?.lead ?? lead;
  const campusId = String(current.schoolCampus?._id ?? current.schoolCampus ?? '');
  const { data: related } = useRelatedData(RELATED, campusId);
  const [category, setCategory] = useState(ATTACHMENT_CATEGORIES[0]);
  const [activation, setActivation] = useState(null);
  const [delivery, setDelivery] = useState([]);
  const [config, setConfig] = useState(null);
  const [note, setNote] = useState('');
  const [tuitionFee, setTuitionFee] = useState('');
  const danger = useHardDelete('admission-attachment', { onDeleted: refresh });
  const revision = current.dossier?.revision ?? 0;
  const writable = feature.ready && feature.canWrite && !busy && !!data;
  const draft = DRAFT_STATUSES.includes(current.status);
  const statuses = (TRANSITIONS[current.status] ?? []).filter((status) => status !== LEAD_STATUS.ADMITTED || ADMISSION_ROLES.includes(user.role));
  useEffect(() => {
    let active = true;
    getAdmissionConfig(campusId).then((response) => { if (active) setConfig(response.data.data); }).catch(() => {});
    return () => { active = false; };
  }, [campusId]);
  const requirements = useFormik({
    initialValues: { categories: config?.admissionRequirements ?? [] }, enableReinitialize: true,
    onSubmit: async ({ categories }) => {
      const result = await run(() => setAdmissionConfig(campusId, categories));
      if (result) setConfig(result);
    },
  });
  const enrollment = useFormik({
    initialValues: { firstName: lead.firstName, lastName: lead.lastName, phone: lead.phone || '', username: '', dateOfBirth: '', gender: '', studentClass: '' },
    validationSchema: admissionEnrollmentSchema(t),
    onSubmit: async (student) => changeStatus('enrolled', student),
  });
  const changeStatus = async (status, student) => {
    if (!writable) return;
    const result = await run(() => updateLeadStatus(lead._id, {
      status, revision, note, student, ...(tuitionFee !== '' && { tuitionFee: Number(tuitionFee) }),
    }));
    if (result) {
      setDelivery(result.delivery || []);
      if (result.activation) setActivation(result.activation);
      setNote('');
      onUpdated?.();
    }
  };
  const upload = async (event) => {
    const file = event.target.files?.[0];
    if (file && writable) await run(() => uploadDossierFile(lead._id, file, category, revision));
    event.target.value = '';
  };
  const input = (name, type = 'text') => <TextField
    fullWidth size="small" name={name} type={type} label={t(`admission.fields.${name}`)}
    value={enrollment.values[name]} onChange={enrollment.handleChange} onBlur={enrollment.handleBlur}
    error={!!(enrollment.touched[name] && enrollment.errors[name])}
    helperText={enrollment.touched[name] && enrollment.errors[name]} disabled={!writable}
    slotProps={type === 'date' ? { inputLabel: { shrink: true } } : undefined}
  />;
  const errorCode = error?.response?.data?.errors?.code;
  const errorKey = [ADMISSION_ERRORS.INCOMPLETE, ADMISSION_ERRORS.CONFLICT, ADMISSION_ERRORS.QUOTA, ADMISSION_ERRORS.DUPLICATE, ADMISSION_ERRORS.FILE].includes(errorCode) ? errorCode : 'generic';
  return <Box sx={{ p: 2.5 }} data-testid="admission-dossier">
    <Stack direction="row" justifyContent="space-between" alignItems="center">
      <Typography variant="h6">{t('admission.title')}</Typography>
      <IconButton aria-label={t('admission.close')} onClick={onClose}><Close /></IconButton>
    </Stack>
    <Typography>{current.firstName} {current.lastName}</Typography>
    <Typography color="text.secondary">{current.email}</Typography>
    <Typography sx={{ my: 1 }} data-testid="admission-status">{t(`admission.status.${current.status}`)}</Typography>
    <Stack spacing={2}>
      {!data && !error && <CircularProgress size={24} />}
      {error && <Alert severity="error">{t(`admission.errors.${errorKey}`)}</Alert>}
      {data?.historicalEnrollment && <Alert severity="warning">{t('admission.historical')}</Alert>}
      {delivery.map((item) => <Alert severity={item.status === 'sent' ? 'success' : 'warning'} key={item.id}>
        {t(`admission.delivery.${['sent', 'failed', 'skipped'].includes(item.status) ? item.status : 'pending'}`)}
      </Alert>)}
      <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
        <Button disabled={!writable || ['rejected', 'abandoned'].includes(current.status)} onClick={async () => {
          const result = await run(() => issueDossierAccess(lead._id));
          if (result) setDelivery(result.delivery);
        }}>{t('admission.sendAccess')}</Button>
        <Button disabled={!writable} onClick={() => run(() => revokeDossierAccess(lead._id))}>{t('admission.revokeAccess')}</Button>
      </Stack>
      <Divider />
      <Typography variant="subtitle2">{t('admission.requirements')}</Typography>
      <Box component="form" onSubmit={requirements.handleSubmit}>
        <FormControl fullWidth size="small" disabled={!writable}>
          <InputLabel id="admission-requirements-label">{t('admission.requirements')}</InputLabel>
          <Select multiple id="admission-requirements" labelId="admission-requirements-label" label={t('admission.requirements')} name="categories"
            value={requirements.values.categories} onChange={requirements.handleChange}>
            {(config?.categories || []).map((item) => <MenuItem value={item} key={item}>{t(`admission.categories.${item}`)}</MenuItem>)}
          </Select>
        </FormControl>
        <Button type="submit" disabled={!writable}>{t('admission.saveRequirements')}</Button>
      </Box>
      <Typography variant="caption">{t('admission.snapshotNotice')}</Typography>
      <Typography variant="body2">{data?.requirements?.map((item) => t(`admission.categories.${item}`)).join(', ') || t('admission.noRequirements')}</Typography>
      {draft && <Stack spacing={1}>
        <FormControl fullWidth size="small" disabled={!writable}>
          <InputLabel id="admission-category-label">{t('admission.category')}</InputLabel>
          <Select id="admission-category" labelId="admission-category-label" label={t('admission.category')} value={category} onChange={(event) => setCategory(event.target.value)}>
            {(data?.categories || []).map((item) => <MenuItem value={item} key={item}>{t(`admission.categories.${item}`)}</MenuItem>)}
          </Select>
        </FormControl>
        <Button component="label" variant="outlined" disabled={!writable}>{t('admission.upload')}
          <input hidden type="file" accept="application/pdf,image/png,image/jpeg" onChange={upload} data-testid="admission-file" />
        </Button>
        <Typography variant="caption">{t('admission.fileRules')}</Typography>
      </Stack>}
      <List dense>
        {(data?.attachments || []).map((file) => <ListItem key={file._id} disableGutters secondaryAction={<Stack direction="row">
          <IconButton aria-label={t('admission.download')} disabled={busy} onClick={() => run(async () => {
            saveBlobResponse(await downloadDossierFile(lead._id, file._id), { fallbackName: file.originalName });
          })}><Download /></IconButton>
          {draft && <IconButton aria-label={t('admission.archive')} disabled={!writable} onClick={() => run(() => archiveDossierFile(lead._id, file._id, revision))}><Archive /></IconButton>}
        </Stack>}><ListItemText sx={{ pr: 9, overflowWrap: 'anywhere' }} primary={file.originalName} secondary={t(`admission.categories.${file.category}`)} /></ListItem>)}
      </List>
      {danger.enabled && data?.archivedAttachments?.length > 0 && <Box>
        <Typography variant="subtitle2">{t('admission.archived')}</Typography>
        {data.archivedAttachments.map((file) => <Stack key={file._id} direction="row" justifyContent="space-between">
          <Typography sx={{ overflowWrap: 'anywhere' }}>{file.originalName}</Typography>
          <HardDeleteAction onHardDelete={danger.canDelete(true) && writable ? () => danger.requestDelete(file._id, file.originalName) : null} />
        </Stack>)}
      </Box>}
      {current.status === 'admitted' && <Box component="form" onSubmit={enrollment.handleSubmit}>
        <Stack spacing={1.5}>
          <Typography variant="subtitle2">{t('admission.enrollment')}</Typography>
          {input('firstName')}{input('lastName')}{input('username')}{input('phone')}{input('dateOfBirth', 'date')}
          {['gender', 'studentClass'].map((field) => <FormControl key={field} fullWidth size="small" disabled={!writable}
            error={!!(enrollment.touched[field] && enrollment.errors[field])}>
            <InputLabel id={`admission-${field}-label`}>{t(`admission.fields.${field}`)}</InputLabel>
            <Select id={`admission-${field}`} labelId={`admission-${field}-label`} name={field} label={t(`admission.fields.${field}`)}
              value={enrollment.values[field]} onChange={enrollment.handleChange} onBlur={enrollment.handleBlur}>
              {(field === 'gender' ? ['male', 'female'].map((value) => ({ value, label: t(`admission.${value}`) }))
                : (related.classes || []).filter((item) => item.status !== 'archived').map((item) => ({ value: item._id, label: item.className })))
                .map((option) => <MenuItem key={option.value} value={option.value}>{option.label}</MenuItem>)}
            </Select>
          </FormControl>)}
          <TextField label={t('admission.tuitionFee')} type="number" size="small" value={tuitionFee} disabled={!writable} onChange={(event) => setTuitionFee(event.target.value)} />
          <Button type="submit" variant="contained" disabled={!writable}>{t('admission.enrollment')}</Button>
        </Stack>
      </Box>}
      {current.student && <Button disabled={!writable} onClick={async () => {
        const result = await run(() => resendActivation('students', current.student._id ?? current.student));
        if (result) setActivation(result.activation ?? result);
      }}>{t('admission.reissueActivation')}</Button>}
      {statuses.length > 0 && <>
        <TextField label={t('admission.note')} value={note} onChange={(event) => setNote(event.target.value)} multiline disabled={!writable} />
        <Stack direction="row" flexWrap="wrap" useFlexGap spacing={1}>
          {statuses.filter((status) => status !== 'enrolled').map((status) => <Button key={status} variant="outlined" disabled={!writable} onClick={() => changeStatus(status)}>{t(`admission.status.${status}`)}</Button>)}
        </Stack>
      </>}
      <Divider />
      {(current.statusHistory || []).map((event, index) => <Typography variant="caption" key={index}>
        {t(`admission.status.${event.status}`)} · {fDateTime(event.changedAt)} {event.note}
      </Typography>)}
    </Stack>
    <ActivationResultDialog open={!!activation} activation={activation} onClose={() => setActivation(null)} />
    <HardDeleteDialog {...danger.dialogProps} />
  </Box>;
}
