import React, { useEffect, useState } from 'react';
import {
  Dialog,
  DialogContent,
  Box,
  Typography,
  IconButton,
  Divider,
  TextField,
  Button,
  Stack,
  List,
  ListItem,
  ListItemText,
  Tooltip,
  CircularProgress,
  Alert,
  MenuItem,
} from '@mui/material';

import {
  Close as CloseIcon,
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Unarchive as UnarchiveIcon,
} from '@mui/icons-material';

import { Formik, Form } from 'formik';
import api from '../../../api/axiosInstance';
import { createLevelSchema } from '../../../yupSchema/createLevelSchema';

const ManageLevel = ({ open, onClose, onLevelsUpdated }) => {
  const [levels, setLevels] = useState([]);
  const [editingLevel, setEditingLevel] = useState(null);

  const handleClose = () => {
    document.activeElement?.blur();
    setEditingLevel(null);
    onClose();
  };
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);

  const isEditMode = Boolean(editingLevel);

  /* ---------------- FETCH ---------------- */
  // Include archived levels so they can be displayed and restored.
  const fetchLevels = async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const res = await api.get('/level', { params: { includeArchived: true } });
      setLevels(res.data?.data || []);
    } catch {
      setErrorMsg('Impossible de charger les niveaux');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open) fetchLevels();
  }, [open]);

  /* ---------------- SUBMIT ---------------- */
  const handleSubmit = async (values, { resetForm, setSubmitting }) => {
    try {
      if (isEditMode) {
        await api.put(`/level/update/${editingLevel._id}`, values);
      } else {
        await api.post('/level', values);
      }

      resetForm();
      setEditingLevel(null);
      await fetchLevels();
      onLevelsUpdated?.();
    } catch (e) {
      setErrorMsg(e?.response?.data?.message || "Échec de l'opération");
    } finally {
      setSubmitting(false);
    }
  };

  /* ---------------- ARCHIVE (soft delete) ---------------- */
  const handleArchive = async (level) => {
    if (!window.confirm('Archiver ce niveau ?')) return;

    try {
      await api.delete(`/level/delete/${level._id}`);
      await fetchLevels();
      onLevelsUpdated?.();
    } catch (e) {
      setErrorMsg(e?.response?.data?.message || 'Impossible d’archiver le niveau');
    }
  };

  /* ---------------- RESTORE ---------------- */
  const handleRestore = async (level) => {
    try {
      await api.patch(`/level/${level._id}/restore`);
      await fetchLevels();
      onLevelsUpdated?.();
    } catch (e) {
      setErrorMsg(e?.response?.data?.message || 'Impossible de restaurer le niveau');
    }
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="sm"
      fullWidth
      disableEnforceFocus
      closeAfterTransition={false}
    >
      {/* HEADER */}
      <Box sx={{ p: 2, display: 'flex', justifyContent: 'space-between' }}>
        <Typography variant="h6" fontWeight={700}>
          Gestion des niveaux
        </Typography>
        <IconButton onClick={handleClose}>
          <CloseIcon />
        </IconButton>
      </Box>

      <Divider />

      <DialogContent>
        {errorMsg && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setErrorMsg(null)}>
            {errorMsg}
          </Alert>
        )}

        {/* FORM */}
        <Formik
          enableReinitialize
          initialValues={{
            name: editingLevel?.name || '',
            code: editingLevel?.code || '',
            type: editingLevel?.type || 'LANGUAGE',
            order: editingLevel?.order || 1,
            description: editingLevel?.description || '',
            status: editingLevel?.status || 'active',
          }}
          validationSchema={createLevelSchema}
          onSubmit={handleSubmit}
        >
          {({ values, handleChange, handleBlur, touched, errors, isSubmitting }) => (
            <Form>
              <Stack spacing={2} mb={3}>
                <TextField
                  label="Nom du niveau"
                  name="name"
                  value={values.name}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  error={touched.name && Boolean(errors.name)}
                  helperText={touched.name && errors.name}
                  fullWidth
                  slotProps={{
                    input: {id: 'name'},
                    inputLabel: {htmlFor: 'name'},
                  }}
                />

                <TextField
                  label="Code"
                  name="code"
                  value={values.code}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  error={touched.code && Boolean(errors.code)}
                  helperText={touched.code && errors.code}
                  fullWidth
                  slotProps={{
                    input: {id: 'code'},
                    inputLabel: {htmlFor: 'code'},
                  }}
                />

                <TextField
                  select
                  label="Type"
                  name="type"
                  value={values.type}
                  onChange={handleChange}
                  slotProps={{
                    input: {id: 'type'},
                    inputLabel: {htmlFor: 'type'},
                  }}
                >
                  <MenuItem value="LANGUAGE">Langue</MenuItem>
                  <MenuItem value="ACADEMIC">Académique</MenuItem>
                  <MenuItem value="PROFESSIONAL">Professionnel</MenuItem>
                </TextField>

                <TextField
                  type="number"
                  label="Ordre"
                  name="order"
                  value={values.order}
                  onChange={handleChange}
                  error={touched.order && Boolean(errors.order)}
                  helperText={touched.order && errors.order}
                  slotProps={{
                    input: {id: 'order'},
                    inputLabel: {htmlFor: 'order'},
                  }}

                />

                <TextField
                  label="Description"
                  name="description"
                  value={values.description}
                  onChange={handleChange}
                  multiline
                  rows={2}
                  slotProps={{
                    input: {id: 'description'},
                    inputLabel: {htmlFor: 'description'},
                  }}
                />

                <Button
                  type="submit"
                  variant="contained"
                  startIcon={<AddIcon />}
                  disabled={isSubmitting}
                >
                  {isEditMode ? 'Mettre à jour' : 'Ajouter'}
                </Button>
              </Stack>
            </Form>
          )}
        </Formik>

        {/* LIST */}
        {loading ? (
          <CircularProgress size={28} />
        ) : (
          <List dense>
            {levels.map((lvl) => (
              <ListItem
                key={lvl._id}
                divider
                secondaryAction={
                  <>
                    <Tooltip title="Modifier">
                      <IconButton
                        size="small"
                        onClick={() => setEditingLevel(lvl)}
                      >
                        <EditIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>

                    {lvl.status === 'archived' ? (
                      <Tooltip title="Restaurer">
                        <IconButton
                          size="small"
                          color="success"
                          onClick={() => handleRestore(lvl)}
                        >
                          <UnarchiveIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    ) : (
                      <Tooltip title="Archiver">
                        <IconButton
                          size="small"
                          color="error"
                          onClick={() => handleArchive(lvl)}
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    )}
                  </>
                }
              >
                <ListItemText
                  primary={`${lvl.name} (${lvl.code})`}
                  secondary={lvl.status === 'archived' ? `${lvl.type} · archivé` : lvl.type}
                  sx={{
                    opacity: lvl.status === 'archived' ? 0.5 : 1,
                  }}
                />
              </ListItem>
            ))}
          </List>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default ManageLevel;
