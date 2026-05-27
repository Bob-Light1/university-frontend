import * as Yup from 'yup';
import { yupEmail, yupPassword, yupConfirmPassword } from '../utils/validationRules';

/**
 * Schéma de validation pour la création d'un compte Admin / Director.
 * Password policy : ≥8 chars · minuscule · majuscule · chiffre · symbole.
 */
export const createAdminSchema = Yup.object({
  admin_name: Yup.string()
    .trim()
    .min(2,   'Name must be at least 2 characters.')
    .max(100, 'Name must not exceed 100 characters.')
    .required('Admin name is required.'),

  email: yupEmail(),

  role: Yup.string()
    .oneOf(['ADMIN', 'DIRECTOR'], 'Role must be ADMIN or DIRECTOR.')
    .required('Role is required.'),

  password:        yupPassword(),
  confirm_password: yupConfirmPassword('password'),
});
