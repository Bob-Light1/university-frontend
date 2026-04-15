import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Button,
  Card,
  CardMedia,
  FormControl,
  FormHelperText,
  Grid,
  IconButton,
  Typography,
  Fade,
  LinearProgress,
} from '@mui/material';
import { CloudUpload, Delete, Image as ImageIcon, CheckCircle } from '@mui/icons-material';
import axios from 'axios';
import { API_BASE_URL } from '../../../config/env';

export default function UploadCampusImage({ onImageChange, disabled = false }) {
  const [file, setFile] = useState(null);
  const [imageUrl, setImageUrl] = useState(null);
  const [error, setError] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadDone, setUploadDone] = useState(false);
  const fileInputRef = useRef(null);

  // While uploading, the component itself is also disabled
  const isDisabled = disabled || isUploading;

  const uploadToCloudinary = async (selectedFile) => {
    setIsUploading(true);
    setUploadDone(false);
    try {
      // 1. Fetch signed upload params from backend
      const { data } = await axios.get(`${API_BASE_URL}/campus/upload-signature`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
        timeout: 10000,
      });
      const { signature, timestamp, folder, cloudName, apiKey } = data.data;

      // 2. POST the file directly to Cloudinary — no backend involvement
      const form = new FormData();
      form.append('file', selectedFile);
      form.append('api_key', apiKey);
      form.append('timestamp', String(timestamp));
      form.append('folder', folder);
      form.append('signature', signature);

      const cloudRes = await axios.post(
        `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
        form,
        { timeout: 30000 },
      );

      if (onImageChange) onImageChange(cloudRes.data.secure_url);
      setUploadDone(true);
    } catch (err) {
      const msg =
        err.response?.data?.error?.message ||
        (err.code === 'ECONNABORTED' ? 'Upload timed out. Please try again.' : null) ||
        'Image upload failed. Please try again.';
      setError(msg);
      setFile(null);
      setImageUrl(null); // triggers useEffect cleanup → revokes blob URL
      if (fileInputRef.current) fileInputRef.current.value = '';
      if (onImageChange) onImageChange(null);
    } finally {
      setIsUploading(false);
    }
  };

  const validateAndSetImage = (selectedFile) => {
    if (!selectedFile) return;

    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!validTypes.includes(selectedFile.type)) {
      setError('Invalid file format. Please use JPG, PNG or WEBP');
      return;
    }

    const maxSize = 5 * 1024 * 1024;
    if (selectedFile.size > maxSize) {
      setError('File is too large. Maximum size is 5MB');
      return;
    }

    setError('');
    setUploadDone(false);
    setFile(selectedFile);
    setImageUrl(URL.createObjectURL(selectedFile));
    uploadToCloudinary(selectedFile);
  };

  const addImage = (event) => {
    validateAndSetImage(event.target.files[0]);
  };

  const removeImage = () => {
    setFile(null);
    setImageUrl(null); // triggers useEffect cleanup → revokes blob URL
    setError('');
    setUploadDone(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
    if (onImageChange) onImageChange(null);
  };

  // Drag and Drop handlers
  const handleDragEnter = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isDisabled) setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (isDisabled) return;
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) validateAndSetImage(droppedFile);
  };

  // Revoke blob URL on change or unmount to avoid memory leaks
  useEffect(() => {
    return () => {
      if (imageUrl) URL.revokeObjectURL(imageUrl);
    };
  }, [imageUrl]);

  // ── Derived display helpers ────────────────────────────────────────────────
  const mainLabel = isUploading
    ? 'Uploading to Cloudinary…'
    : uploadDone && imageUrl
    ? '✓ Image Uploaded'
    : isDragging
    ? 'Drop image here'
    : 'Choose a campus image';

  return (
    <Grid size={12}>
      <FormControl fullWidth error={Boolean(error)}>
        <Box
          onDragEnter={handleDragEnter}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          sx={{
            border: '2px dashed',
            borderColor: error
              ? 'error.main'
              : isDragging
              ? 'primary.main'
              : imageUrl
              ? 'success.main'
              : 'grey.300',
            borderRadius: 2,
            p: 3,
            textAlign: 'center',
            bgcolor: isDragging
              ? 'primary.50'
              : imageUrl
              ? 'success.50'
              : 'grey.50',
            transition: 'all 0.3s ease',
            opacity: isDisabled ? 0.6 : 1,
            cursor: isDisabled ? 'not-allowed' : 'pointer',
            '&:hover': !isDisabled && {
              borderColor: error ? 'error.dark' : 'primary.main',
              bgcolor: isDragging ? 'primary.100' : 'grey.100',
              transform: 'translateY(-2px)',
              boxShadow: 2,
            },
          }}
        >
          <input
            ref={fileInputRef}
            accept="image/*"
            style={{ display: 'none' }}
            id="campus-image-upload"
            type="file"
            onChange={addImage}
            disabled={isDisabled}
          />
          <label htmlFor="campus-image-upload" style={{ cursor: isDisabled ? 'not-allowed' : 'pointer' }}>
            <Box
              sx={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 2,
                pointerEvents: isDisabled ? 'none' : 'auto',
              }}
            >
              {uploadDone && imageUrl ? (
                <CheckCircle sx={{ fontSize: 48, color: 'success.main' }} />
              ) : (
                <ImageIcon
                  sx={{
                    fontSize: 48,
                    color: isDragging ? 'primary.main' : 'grey.400',
                    transition: 'color 0.3s',
                  }}
                />
              )}

              <Box>
                <Typography
                  variant="h6"
                  color={uploadDone && imageUrl ? 'success.main' : 'text.secondary'}
                  sx={{ fontWeight: uploadDone && imageUrl ? 'bold' : 'normal' }}
                >
                  {mainLabel}
                </Typography>
                {!imageUrl && !isUploading && (
                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
                    or drag and drop here
                  </Typography>
                )}
              </Box>

              <Button
                component="span"
                variant={imageUrl ? 'outlined' : 'contained'}
                startIcon={<CloudUpload />}
                disabled={isDisabled}
                sx={{
                  mt: 1,
                  backgroundColor: imageUrl ? 'transparent' : '#4989c8',
                  '&:hover': {
                    backgroundColor: imageUrl ? 'transparent' : '#3a6fa8',
                  },
                }}
              >
                {imageUrl ? 'Change Image' : 'Browse Files'}
              </Button>

              <Typography variant="caption" color="text.secondary">
                JPG, PNG or WEBP • Maximum 5MB
              </Typography>
            </Box>
          </label>

          {/* Real upload progress bar */}
          {isUploading && (
            <Box sx={{ width: '100%', mt: 2 }}>
              <LinearProgress />
            </Box>
          )}
        </Box>

        {/* Error message */}
        {error && (
          <FormHelperText sx={{ mt: 1, fontSize: '0.875rem' }}>
            {error}
          </FormHelperText>
        )}

        {/* Status messages */}
        {file && !error && isUploading && (
          <Fade in>
            <FormHelperText sx={{ color: 'info.main', mt: 1, fontSize: '0.875rem' }}>
              Uploading to Cloudinary…
            </FormHelperText>
          </Fade>
        )}
        {file && !error && uploadDone && (
          <Fade in>
            <FormHelperText sx={{ color: 'success.main', mt: 1, fontSize: '0.875rem' }}>
              ✓ Uploaded: {file.name} • {(file.size / 1024).toFixed(2)} KB
            </FormHelperText>
          </Fade>
        )}
      </FormControl>

      {/* Image Preview */}
      {imageUrl && (
        <Fade in>
          <Box sx={{ mt: 2 }}>
            <Card
              elevation={3}
              sx={{
                position: 'relative',
                borderRadius: 2,
                overflow: 'hidden',
                border: '2px solid',
                borderColor: 'success.main',
              }}
            >
              <CardMedia
                component="img"
                image={imageUrl}
                alt="Campus preview"
                sx={{
                  height: 240,
                  objectFit: 'cover',
                }}
              />

              {/* Delete button */}
              <IconButton
                onClick={removeImage}
                disabled={isDisabled}
                sx={{
                  position: 'absolute',
                  top: 8,
                  right: 8,
                  bgcolor: 'rgba(0, 0, 0, 0.7)',
                  color: 'white',
                  backdropFilter: 'blur(4px)',
                  '&:hover': {
                    bgcolor: 'error.main',
                    transform: 'scale(1.1)',
                  },
                  transition: 'all 0.3s',
                }}
              >
                <Delete />
              </IconButton>

              {/* Image info overlay */}
              <Box
                sx={{
                  position: 'absolute',
                  bottom: 0,
                  left: 0,
                  right: 0,
                  background: 'linear-gradient(to top, rgba(0,0,0,0.8), transparent)',
                  color: 'white',
                  p: 2,
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <CheckCircle sx={{ fontSize: 20 }} />
                  <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                    Campus Image Preview
                  </Typography>
                </Box>
                {file && (
                  <Typography variant="caption" sx={{ opacity: 0.9 }}>
                    {file.name} • {(file.size / (1024 * 1024)).toFixed(2)} MB
                  </Typography>
                )}
              </Box>
            </Card>
          </Box>
        </Fade>
      )}
    </Grid>
  );
}
