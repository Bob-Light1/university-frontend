/**
 * Converts Axios errors into user-friendly messages.
 * Used by TeacherForm, StudentForm, and any other form.
 */
export const getSubmitErrorMessage = (err) => {
  if (err.response?.status === 400)
    return err.response.data?.message || err.response.data?.error || 'Validation error';
  if (err.response?.status === 413)
    return 'File too large. Maximum size is 5 MB';
  if (err.response?.status === 401)
    return 'Session expired. Please log in again';
  if (err.response?.status >= 500)
    return 'Server error. Please try again later';
  if (err.code === 'ECONNABORTED')
    return 'Upload timeout. Please check your connection';
  return 'An unexpected error occurred';
};