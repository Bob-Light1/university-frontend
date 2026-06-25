import * as Yup from 'yup';
import { yupPassword, yupConfirmPassword } from '../utils/validationRules';

/**
 * @file activateSchema.js
 * @description Validation for the account-activation flow. The password policy
 * mirrors the backend (shared/utils/validation-helpers.validatePasswordStrength).
 */

/** Link mode: the token comes from the URL, the user only sets a password. */
export const activateLinkSchema = Yup.object({
  password:        yupPassword(),
  confirmPassword: yupConfirmPassword('password'),
});

/** Offline mode: the user supplies their identifier + the short code. */
export const activateCodeSchema = Yup.object({
  identifier: Yup.string()
    .trim()
    .required('Your username, email or matricule is required'),
  code: Yup.string()
    .trim()
    .required('Activation code is required'),
  password:        yupPassword(),
  confirmPassword: yupConfirmPassword('password'),
});
