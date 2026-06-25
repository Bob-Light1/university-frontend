/**
 * @file FinanceAttachments.jsx
 * @description Supporting-document uploader for incomes / expenses.
 *
 * Workflow (mirrors ProfileImageUploader): get a finance Cloudinary signature →
 * upload each file directly to Cloudinary → keep only the resulting secure URLs.
 * The backend stores `attachments[]` as plain URL strings (receipt / invoice).
 *
 * Props:
 *  value     string[]            — current attachment URLs
 *  onChange  (urls) => void      — called with the updated URL list
 *  disabled  bool
 */

import { useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Box, Stack, Button, Typography, Chip, CircularProgress, Link,
} from '@mui/material';
import { AttachFile, InsertDriveFile, Close } from '@mui/icons-material';
import axios from 'axios';

import { getUploadSignature } from '../../../services/financeService';

const ACCEPT = 'image/jpeg,image/jpg,image/png,image/webp,application/pdf';
const VALID_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'application/pdf'];
const MAX_BYTES = 5 * 1024 * 1024; // 5 MB

/** Derive a short, human-friendly label from a Cloudinary URL. */
const fileLabel = (url) => {
  try {
    const last = decodeURIComponent(url.split('/').pop().split('?')[0]);
    return last.length > 28 ? `${last.slice(0, 25)}…` : last;
  } catch {
    return 'attachment';
  }
};

const FinanceAttachments = ({ value = [], onChange, disabled = false }) => {
  const { t } = useTranslation('finance');
  const [uploading, setUploading] = useState(false);
  const [error,     setError]     = useState('');
  const inputRef = useRef(null);

  const handleFiles = async (fileList) => {
    const files = Array.from(fileList || []);
    if (files.length === 0) return;

    for (const f of files) {
      if (!VALID_TYPES.includes(f.type)) {
        setError(t('attachments.invalidType'));
        return;
      }
      if (f.size > MAX_BYTES) {
        setError(t('attachments.tooLarge'));
        return;
      }
    }

    setError('');
    setUploading(true);
    try {
      const { data: sigRes } = await getUploadSignature();
      const { signature, timestamp, folder, cloudName, apiKey } = sigRes.data;

      const uploaded = [];
      for (const file of files) {
        const form = new FormData();
        form.append('file',      file);
        form.append('api_key',   apiKey);
        form.append('timestamp', String(timestamp));
        form.append('folder',    folder);
        form.append('signature', signature);

        // `auto` resource type so both images and PDFs upload correctly.
        const { data: cloudRes } = await axios.post(
          `https://api.cloudinary.com/v1_1/${cloudName}/auto/upload`,
          form,
          { timeout: 30000 },
        );
        uploaded.push(cloudRes.secure_url);
      }

      onChange([...value, ...uploaded]);
    } catch (err) {
      setError(err.response?.data?.error?.message || t('attachments.uploadFailed'));
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  const removeAt = (idx) => onChange(value.filter((_, i) => i !== idx));

  return (
    <Box>
      <Stack direction="row" alignItems="center" spacing={1.5} sx={{ mb: value.length ? 1 : 0 }}>
        <Button
          variant="outlined"
          size="small"
          startIcon={uploading ? <CircularProgress size={14} color="inherit" /> : <AttachFile />}
          onClick={() => inputRef.current?.click()}
          disabled={disabled || uploading}
          sx={{ textTransform: 'none', borderRadius: 2 }}
        >
          {uploading ? t('attachments.uploading') : t('attachments.attach')}
        </Button>
        <Typography variant="caption" color="text.secondary">
          {t('attachments.hint')}
        </Typography>
        <input
          ref={inputRef}
          type="file"
          accept={ACCEPT}
          multiple
          style={{ display: 'none' }}
          onChange={(e) => handleFiles(e.target.files)}
          disabled={disabled || uploading}
        />
      </Stack>

      {error && (
        <Typography variant="caption" color="error" sx={{ display: 'block', mb: 1 }}>{error}</Typography>
      )}

      {value.length > 0 && (
        <Stack direction="row" flexWrap="wrap" gap={1}>
          {value.map((url, idx) => (
            <Chip
              key={`${url}-${idx}`}
              icon={<InsertDriveFile />}
              label={(
                <Link href={url} target="_blank" rel="noopener noreferrer" underline="hover" color="inherit">
                  {fileLabel(url)}
                </Link>
              )}
              onDelete={disabled ? undefined : () => removeAt(idx)}
              deleteIcon={<Close />}
              variant="outlined"
              sx={{ maxWidth: 220, borderRadius: 2 }}
            />
          ))}
        </Stack>
      )}
    </Box>
  );
};

export default FinanceAttachments;
