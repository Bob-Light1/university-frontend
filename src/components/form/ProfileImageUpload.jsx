/**
 * Self-contained avatar upload widget.
 * Validates type, extension, size and decodes the image before accepting it.
 */
import React, { useRef } from 'react';
import {
  Avatar, Box, Button, IconButton, Paper,
  Stack, Typography, useTheme,
} from '@mui/material';
import { Close, Person, PhotoCamera } from '@mui/icons-material';

const ALLOWED_TYPES      = ['image/jpeg', 'image/png', 'image/webp'];
const ALLOWED_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.webp'];
const MAX_SIZE           = 5 * 1024 * 1024; // 5 MB

/**
 * @param {string|null}  preview        – data-URL or remote URL currently shown
 * @param {string}       altText        – Avatar alt attribute
 * @param {function}     onFileAccepted – called with (File, dataURL)
 * @param {function}     onRemove       – called when the × button is clicked
 * @param {function}     onError        – called with an error message string
 */
const ProfileImageUpload = ({ preview, altText, onFileAccepted, onRemove, onError }) => {
  const theme = useTheme();
  const inputRef = useRef(null);

  const handleChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!ALLOWED_TYPES.includes(file.type)) {
      return onError('Only JPG, PNG and WEBP images are allowed');
    }
    const ext = file.name.toLowerCase().match(/\.[^.]+$/)?.[0];
    if (!ext || !ALLOWED_EXTENSIONS.includes(ext)) {
      return onError('Invalid file extension');
    }
    if (file.size > MAX_SIZE) {
      return onError('Image size should not exceed 5 MB');
    }

    const reader = new FileReader();
    reader.onerror = () => onError('Error reading file');
    reader.onload = (ev) => {
      const img = new Image();
      img.onerror = () => onError('File is not a valid image');
      img.onload  = () => onFileAccepted(file, ev.target.result);
      img.src     = ev.target.result;
    };
    reader.readAsDataURL(file);
  };

  return (
    <Paper
      elevation={0}
      sx={{
        p: 3,
        textAlign: 'center',
        bgcolor: 'background.neutral',
        borderRadius: 2,
        border: `2px dashed ${theme.palette.divider}`,
      }}
    >
      <Stack spacing={2} alignItems="center">
        <Box sx={{ position: 'relative' }}>
          <Avatar
            src={preview}
            alt={altText}
            sx={{
              width: 120,
              height: 120,
              border: `4px solid ${theme.palette.primary.main}`,
              boxShadow: theme.shadows[4],
              bgcolor: theme.palette.grey[200],
              fontSize: '2.5rem',
              fontWeight: 700,
            }}
          >
            <Person sx={{ fontSize: 60 }} />
          </Avatar>

          {preview && (
            <IconButton
              onClick={onRemove}
              sx={{
                position: 'absolute',
                top: -8, right: -8,
                bgcolor: 'error.main',
                color: 'white',
                '&:hover': { bgcolor: 'error.dark' },
                width: 32, height: 32,
              }}
            >
              <Close fontSize="small" />
            </IconButton>
          )}
        </Box>

        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          hidden
          onChange={handleChange}
          // Reset so the same file can be re-selected after removal
          onClick={(e) => { e.target.value = ''; }}
        />

        <Button
          variant="outlined"
          startIcon={<PhotoCamera />}
          onClick={() => inputRef.current?.click()}
          sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 600 }}
        >
          {preview ? 'Change Photo' : 'Upload Photo'}
        </Button>

        <Typography variant="caption" color="text.secondary">
          Recommended: square image, max 5 MB (JPG, PNG, WEBP)
        </Typography>
      </Stack>
    </Paper>
  );
};

export default ProfileImageUpload;