import * as Yup from 'yup';
import { yupEmail, yupUsername, yupPasswordLogin } from '../utils/validationRules';

/**
 * Schema de connexion universel — accepte email OU username comme identifiant.
 * Note : le password n'est pas validé pour son format au login (cela bloquerait
 * les anciens comptes qui ne respectent pas encore la politique actuelle).
 */
export const loginSchema = Yup.object({
  identifier: Yup.string()
    .trim()
    .required('Email or username is required')
    .test('valid-identifier', 'Please enter a valid email or username', (value) => {
      if (!value) return false;
      if (value.includes('@')) {
        return /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(value);
      }
      return /^[a-z0-9_.-]{3,30}$/.test(value.toLowerCase());
    }),

  password: yupPasswordLogin(),
});

// ── Schemas spécialisés (si nécessaire par type de formulaire) ────────────────

export const emailLoginSchema = Yup.object({
  email:    yupEmail(),
  password: yupPasswordLogin(),
});

export const usernameLoginSchema = Yup.object({
  username: yupUsername(true),
  password: yupPasswordLogin(),
});
