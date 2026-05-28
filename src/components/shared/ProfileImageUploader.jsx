/**
 * @file ProfileImageUploader.jsx
 * @description Avatar uploader for profile pages.
 * Workflow: get Cloudinary signature → upload file to Cloudinary → return secure_url.
 *
 * Props:
 *  currentImage      string | null   — existing profileImage URL
 *  signatureEndpoint string          — e.g. '/students/me/upload-signature'
 *  onUploaded        (url) => void   — called with Cloudinary secure_url
 *  size              number          — avatar diameter in px (default 96)
 *  disabled          bool
 */

import { useRef, useState } from 'react';
import { Avatar, Box, IconButton, CircularProgress, Tooltip } from '@mui/material';
import { PhotoCamera } from '@mui/icons-material';
import axios from 'axios';
import api from '../../api/axiosInstance';

export default function ProfileImageUploader({
  currentImage = null,
  signatureEndpoint,
  onUploaded,
  size = 96,
  disabled = false,
}) {
  const [preview,    setPreview]    = useState(null);
  const [uploading,  setUploading]  = useState(false);
  const [error,      setError]      = useState('');
  const inputRef = useRef(null);

  const handleFile = async (file) => {
    if (!file) return;

    const valid = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!valid.includes(file.type)) {
      setError('JPG, PNG or WEBP only.');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError('Max 5 MB.');
      return;
    }

    setError('');
    setPreview(URL.createObjectURL(file));
    setUploading(true);

    try {
      const { data: sigData } = await api.get(signatureEndpoint);
      const { signature, timestamp, folder, cloudName, apiKey } = sigData.data;

      const form = new FormData();
      form.append('file',      file);
      form.append('api_key',   apiKey);
      form.append('timestamp', String(timestamp));
      form.append('folder',    folder);
      form.append('signature', signature);

      const { data: cloudRes } = await axios.post(
        `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
        form,
        { timeout: 30000 }
      );

      if (onUploaded) onUploaded(cloudRes.secure_url);
    } catch (err) {
      setError(err.response?.data?.error?.message || 'Upload failed. Try again.');
      setPreview(null);
    } finally {
      setUploading(false);
    }
  };

  const displayImage = preview || currentImage;

  return (
    <Box sx={{ position: 'relative', display: 'inline-block' }}>
      <Avatar
        src={displayImage || undefined}
        sx={{ width: size, height: size, fontSize: size * 0.35, border: '3px solid rgba(0,0,0,0.1)' }}
      />

      {uploading && (
        <CircularProgress
          size={size}
          sx={{ position: 'absolute', top: 0, left: 0, color: 'primary.main', opacity: 0.7 }}
        />
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/jpg,image/png,image/webp"
        style={{ display: 'none' }}
        onChange={(e) => handleFile(e.target.files[0])}
        disabled={disabled || uploading}
      />

      <Tooltip title={error || 'Change photo'}>
        <IconButton
          size="small"
          onClick={() => inputRef.current?.click()}
          disabled={disabled || uploading}
          sx={{
            position: 'absolute',
            bottom: 0,
            right: 0,
            bgcolor: error ? 'error.main' : 'primary.main',
            color: 'white',
            width: 28,
            height: 28,
            '&:hover': { bgcolor: error ? 'error.dark' : 'primary.dark' },
          }}
        >
          <PhotoCamera sx={{ fontSize: 14 }} />
        </IconButton>
      </Tooltip>
    </Box>
  );
}
