import * as Yup from 'yup';
import { yupPassword, yupConfirmPassword } from '../utils/validationRules';

/**
 * Schema "changement de mot de passe" — utilisé par Student, Teacher, Parent.
 * Le champ currentPassword est libre (juste requis) ; newPassword suit la
 * politique complète (symbole inclus).
 */
export const passwordSchema = Yup.object().shape({
  currentPassword: Yup.string().required('Current password is required'),
  newPassword:     yupPassword(),
  confirmPassword: yupConfirmPassword('newPassword'),
});
