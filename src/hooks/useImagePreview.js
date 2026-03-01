/**
 * Manages the profile-image preview URL and the corresponding File object
 * that will be appended to FormData on submit.
 *
 * @param {string|null} initialUrl – remote URL coming from initialData
 */
import { useState, useCallback } from 'react';
import { IMAGE_BASE_URL } from '../config/env';

const toAbsoluteUrl = (path) => {
  if (!path) return null;
  if (path.startsWith('http')) return path;
  return `${IMAGE_BASE_URL.replace(/\/$/, '')}/${path.replace(/^\//, '')}`;
};

const useImagePreview = (initialPath) => {
  const originalUrl = toAbsoluteUrl(initialPath);

  const [preview, setPreview] = useState(originalUrl);
  const [file, setFile]       = useState(null);

  const accept = useCallback((newFile, dataUrl) => {
    setFile(newFile);
    setPreview(dataUrl);
  }, []);

  const remove = useCallback(() => {
    setFile(null);
    setPreview(originalUrl); // restore original when editing
  }, [originalUrl]);

  return { preview, file, accept, remove };
};

export default useImagePreview;