/**
 * Tiny hook that encapsulates the Snackbar open/close state so forms
 * don't have to repeat the same boilerplate.
 */
import { useState, useCallback } from 'react';

const useFormSnackbar = () => {
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  const showSnackbar = useCallback((message, severity = 'success') => {
    setSnackbar({ open: true, message, severity });
  }, []);

  const closeSnackbar = useCallback(() => {
    setSnackbar((prev) => ({ ...prev, open: false }));
  }, []);

  return { snackbar, showSnackbar, closeSnackbar };
};

export default useFormSnackbar;