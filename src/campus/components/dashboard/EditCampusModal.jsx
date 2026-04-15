import React from 'react';
import {
  Modal, Box, Typography, TextField, Button, Stack,
  IconButton, Avatar, CircularProgress, LinearProgress,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import PhotoCamera from '@mui/icons-material/PhotoCamera';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import axios from 'axios';
import { IMAGE_BASE_URL, API_BASE_URL } from '../../../config/env';
import { useAuth } from '../../../hooks/useAuth';

const style = {
  position: 'absolute',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  width: { xs: '90%', sm: 500 },
  bgcolor: 'background.paper',
  borderRadius: 4,
  boxShadow: 24,
  p: 4,
};

/** Resolve a campus_image value to a displayable URL. */
const resolveImageSrc = (value) => {
  if (!value) return null;
  if (value.startsWith('http')) return value;
  return `${IMAGE_BASE_URL}${value}`;
};

export default function EditCampusModal({ open, handleClose, campusData, onUpdate }) {
  const [loading, setLoading] = React.useState(false);
  const [imageUploading, setImageUploading] = React.useState(false);
  const [imageError, setImageError] = React.useState('');
  const [previewUrl, setPreviewUrl] = React.useState(null);
  const [cloudinaryUrl, setCloudinaryUrl] = React.useState(null);
  const { updateUser } = useAuth();

  // Reset image state when modal opens with new campusData
  React.useEffect(() => {
    if (open) {
      setPreviewUrl(null);
      setCloudinaryUrl(null);
      setImageError('');
    }
  }, [open, campusData?._id]);

  const uploadImageToCloudinary = async (file) => {
    setImageUploading(true);
    setImageError('');
    try {
      const { data } = await axios.get(`${API_BASE_URL}/campus/upload-signature`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
        timeout: 10000,
      });
      const { signature, timestamp, folder, cloudName, apiKey } = data.data;

      const form = new FormData();
      form.append('file', file);
      form.append('api_key', apiKey);
      form.append('timestamp', String(timestamp));
      form.append('folder', folder);
      form.append('signature', signature);

      const cloudRes = await axios.post(
        `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
        form,
        { timeout: 30000 },
      );
      setCloudinaryUrl(cloudRes.data.secure_url);
    } catch (err) {
      setImageError('Image upload failed. Please try again.');
      setPreviewUrl(null);
      setCloudinaryUrl(null);
    } finally {
      setImageUploading(false);
    }
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      setImageError('Invalid format. Use JPG, PNG or WEBP.');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setImageError('File too large. Maximum 5 MB.');
      return;
    }

    setImageError('');
    setPreviewUrl(URL.createObjectURL(file));
    uploadImageToCloudinary(file);
  };

  const formik = useFormik({
    initialValues: {
      campus_name:  campusData?.campus_name  || '',
      manager_name: campusData?.manager_name || '',
      email:        campusData?.email        || '',
    },
    enableReinitialize: true,
    validationSchema: Yup.object({
      campus_name:  Yup.string().required('Required'),
      manager_name: Yup.string().required('Required'),
      email:        Yup.string().email('Invalid email').required('Required'),
    }),

    onSubmit: async (values) => {
      if (imageUploading) return; // wait for image upload to finish
      setLoading(true);
      try {
        const payload = {
          campus_name:  values.campus_name,
          manager_name: values.manager_name,
          email:        values.email,
          ...(cloudinaryUrl && { campus_image: cloudinaryUrl }),
        };

        const res = await axios.put(
          `${API_BASE_URL}/campus/${campusData._id}`,
          payload,
          {
            headers: {
              'Content-Type':  'application/json',
              'Authorization': `Bearer ${localStorage.getItem('token')}`,
            },
            timeout: 15000,
          },
        );

        if (res.data.success) {
          const updated = res.data.data ?? res.data.updatedCampus ?? res.data;
          onUpdate(updated);
          updateUser({
            manager_name: updated.manager_name,
            image_url:    updated.campus_image,
            email:        updated.email,
          });
          handleClose();
        }
      } catch (error) {
        console.error('Update error:', error.response || error);
      } finally {
        setLoading(false);
      }
    },
  });

  const currentImageSrc = previewUrl || resolveImageSrc(campusData?.campus_image);

  return (
    <Modal open={open} onClose={handleClose}>
      <Box sx={style}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
          <Typography variant="h6" fontWeight="bold">Edit Campus</Typography>
          <IconButton onClick={handleClose}><CloseIcon /></IconButton>
        </Box>

        <form onSubmit={formik.handleSubmit}>
          <Stack spacing={3}>
            {/* Image preview & upload */}
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
              <Avatar src={currentImageSrc} sx={{ width: 80, height: 80 }} />
              {imageUploading && <LinearProgress sx={{ width: '100%' }} />}
              {imageError && (
                <Typography variant="caption" color="error">{imageError}</Typography>
              )}
              {cloudinaryUrl && !imageUploading && (
                <Typography variant="caption" color="success.main">✓ Image uploaded</Typography>
              )}
              <Button
                variant="text"
                component="label"
                startIcon={<PhotoCamera />}
                size="small"
                disabled={imageUploading || loading}
              >
                Change Image
                <input
                  hidden
                  accept="image/jpeg,image/jpg,image/png,image/webp"
                  type="file"
                  onChange={handleImageChange}
                />
              </Button>
            </Box>

            <TextField
              fullWidth name="campus_name" label="Campus Name"
              value={formik.values.campus_name}
              onChange={formik.handleChange}
              error={formik.touched.campus_name && Boolean(formik.errors.campus_name)}
              helperText={formik.touched.campus_name && formik.errors.campus_name}
            />
            <TextField
              fullWidth name="manager_name" label="Manager Name"
              value={formik.values.manager_name}
              onChange={formik.handleChange}
              error={formik.touched.manager_name && Boolean(formik.errors.manager_name)}
              helperText={formik.touched.manager_name && formik.errors.manager_name}
            />
            <TextField
              fullWidth name="email" label="Email"
              value={formik.values.email}
              onChange={formik.handleChange}
              error={formik.touched.email && Boolean(formik.errors.email)}
              helperText={formik.touched.email && formik.errors.email}
            />

            <Stack direction="row" spacing={2} justifyContent="flex-end">
              <Button onClick={handleClose} disabled={loading}>Cancel</Button>
              <Button
                type="submit"
                variant="contained"
                disabled={loading || imageUploading}
                startIcon={loading && <CircularProgress size={16} color="inherit" />}
              >
                {loading ? 'Saving…' : 'Save Changes'}
              </Button>
            </Stack>
          </Stack>
        </form>
      </Box>
    </Modal>
  );
}
