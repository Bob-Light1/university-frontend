import * as Yup from 'yup';
import i18n from '../i18n/i18n';
import { yupEmail, yupUsername, yupPasswordLogin } from '../utils/validationRules';

/**
 * Universal login schema — accepts an email OR a username as the identifier.
 * Note: the password format is not validated at login (it would lock out legacy
 * accounts that predate the current policy).
 *
 * Messages are lazy thunks so a language switch is reflected on the next
 * validation pass — see validationRules.js for the rationale.
 */
export const loginSchema = Yup.object({
  identifier: Yup.string()
    .trim()
    .required(() => i18n.t('errors:validation.identifierRequired'))
    .test(
      'valid-identifier',
      () => i18n.t('errors:validation.identifierInvalid'),
      (value) => {
        if (!value) return false;
        if (value.includes('@')) {
          return /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(value);
        }
        return /^[a-z0-9_.-]{3,30}$/.test(value.toLowerCase());
      },
    ),

  password: yupPasswordLogin(),
});

// ── Specialised schemas (when a form needs one identifier kind only) ───────────

export const emailLoginSchema = Yup.object({
  email:    yupEmail(),
  password: yupPasswordLogin(),
});

export const usernameLoginSchema = Yup.object({
  username: yupUsername(true),
  password: yupPasswordLogin(),
});
