import * as Yup from 'yup';
import i18n from '../i18n/i18n';
import { yupPassword, yupConfirmPassword } from '../utils/validationRules';

/**
 * Change-password schema — used by Student, Teacher, Parent.
 * currentPassword is free-form (presence only); newPassword follows the full
 * policy (symbol included).
 */
export const passwordSchema = Yup.object().shape({
  currentPassword: Yup.string().required(() => i18n.t('errors:validation.currentPasswordRequired')),
  newPassword:     yupPassword(),
  confirmPassword: yupConfirmPassword('newPassword'),
});
