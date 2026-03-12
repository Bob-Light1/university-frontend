import * as yup from 'yup';

/**
 * Yup validation schema for the CreateAdmin form.
 *
 * Constraints are intentionally aligned with the backend (admin.controller.js):
 *  - admin_name : 2–100 chars  (matches model minlength/maxlength)
 *  - email      : valid format, lowercased
 *  - password   : ≥8 chars, ≥1 uppercase, ≥1 digit  (mirrors backend checks)
 *  - role       : ADMIN | DIRECTOR  (matches ADMIN_ROLES enum)
 *  - confirm_password : must match password (client-side only — not sent to API)
 */
export const createAdminSchema = yup.object({
  admin_name: yup
    .string()
    .trim()
    .min(2, 'Name must be at least 2 characters.')
    .max(100, 'Name must not exceed 100 characters.')
    .required('Admin name is required.'),

  email: yup
    .string()
    .trim()
    .lowercase()
    .email('Please enter a valid email address.')
    .required('Email is required.'),

  role: yup
    .string()
    .oneOf(['ADMIN', 'DIRECTOR'], 'Role must be ADMIN or DIRECTOR.')
    .required('Role is required.'),

  password: yup
    .string()
    .min(8, 'Password must be at least 8 characters.')
    .matches(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
      'Password must contain at least one uppercase letter, one lowercase letter, and one number.'
    )
    .required('Password is required.'),

  confirm_password: yup
    .string()
    .oneOf([yup.ref('password')], 'Passwords do not match.')
    .required('Please confirm your password.'),
});