/**
 * @file validationRules.js
 * @description Source unique de vérité pour toutes les règles de validation utilisateur.
 *
 * Exporte des Yup field builders réutilisables et des constantes REGEX.
 * Utilisation dans les schemas Yup:
 *
 *   import { yupEmail, yupPassword, yupPhone, yupName } from '../utils/validationRules';
 *
 *   const schema = Yup.object({
 *     email:    yupEmail(),
 *     password: yupPassword(),
 *     phone:    yupPhone(true),
 *     firstName: yupName({ label: 'First name' }),
 *   });
 *
 * Politique password uniforme (tous types d'utilisateurs) :
 *   ≥8 chars · ≥1 minuscule · ≥1 majuscule · ≥1 chiffre · ≥1 symbole · pas d'espace
 */

import * as Yup from 'yup';

// ── Regex constants ────────────────────────────────────────────────────────────

export const REGEX = {
  EMAIL:     /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,

  // E.164-like: + suivi de 7–19 chiffres (format produit par <PhoneInput />)
  PHONE:     /^\+[0-9]{7,19}$/,

  // Noms (accents supportés, espaces, tirets, apostrophes)
  NAME:      /^[a-zA-ZÀ-ÿ\s'-]+$/,

  // Usernames
  USERNAME:  /^[a-z0-9_.-]+$/,

  // Password components
  PW_LOWER:  /[a-z]/,
  PW_UPPER:  /[A-Z]/,
  PW_DIGIT:  /[0-9]/,
  // eslint-disable-next-line no-useless-escape
  PW_SYMBOL: /[!@#$%^&*()_\-+=\[\]{};:'",.<>?\/\\|~]/,
};

// ── Email ──────────────────────────────────────────────────────────────────────

/**
 * @param {{ required?: boolean, maxLength?: number }} opts
 */
export const yupEmail = (opts = {}) => {
  const { required = true, maxLength = 100 } = opts;
  let s = Yup.string()
    .trim()
    .lowercase()
    .max(maxLength, `Email must not exceed ${maxLength} characters`)
    .matches(REGEX.EMAIL, 'Please enter a valid email address');
  return required ? s.required('Email is required') : s.nullable().notRequired();
};

// ── Password ───────────────────────────────────────────────────────────────────

/**
 * Champ password complet — formulaires de création et changement de password.
 * @param {{ required?: boolean, isEdit?: boolean }} opts
 *   isEdit: true → complètement optionnel (vide = ne pas changer)
 */
export const yupPassword = (opts = {}) => {
  const { required = true, isEdit = false } = opts;
  if (isEdit) return Yup.string().notRequired();

  let s = Yup.string()
    .min(8,   'Password must be at least 8 characters')
    .max(128, 'Password must not exceed 128 characters')
    .matches(REGEX.PW_LOWER,  'Must contain at least one lowercase letter')
    .matches(REGEX.PW_UPPER,  'Must contain at least one uppercase letter')
    .matches(REGEX.PW_DIGIT,  'Must contain at least one number')
    .matches(REGEX.PW_SYMBOL, 'Must contain at least one special character (e.g. !@#$%)')
    .test('no-spaces', 'Password must not contain spaces', (v) => !v || !/\s/.test(v));

  return required ? s.required('Password is required') : s.notRequired();
};

/**
 * Champ password pour la connexion — présence uniquement, pas de règles de format.
 * Appliquer des règles de format au login bloquerait les anciens comptes.
 */
export const yupPasswordLogin = () =>
  Yup.string().min(1, 'Password is required').required('Password is required');

/**
 * Confirmation de password.
 * @param {string} refField — nom du champ password à vérifier (défaut: 'password')
 */
export const yupConfirmPassword = (refField = 'password') =>
  Yup.string()
    .oneOf([Yup.ref(refField)], 'Passwords do not match')
    .required('Please confirm your password');

// ── Téléphone ──────────────────────────────────────────────────────────────────

/**
 * Champ téléphone — valide le format E.164-like produit par <PhoneInput />.
 * Valeur stockée : "+237612345678" (pas d'espaces/parenthèses).
 *
 * Dans les formulaires, utiliser le composant <PhoneInput /> avec :
 *   onChange={(v) => formik.setFieldValue('phone', v)}
 *
 * @param {boolean} required
 */
export const yupPhone = (required = false) => {
  let s = Yup.string()
    .trim()
    .matches(REGEX.PHONE, 'Please enter a valid phone number (e.g. +237 612 345 678)');
  return required ? s.required('Phone number is required') : s.nullable().notRequired();
};

// ── Noms ───────────────────────────────────────────────────────────────────────

/**
 * @param {{ min?: number, max?: number, label?: string, required?: boolean, validateChars?: boolean }} opts
 *   validateChars: false → n'applique pas le regex de caractères (pour des noms libres)
 */
export const yupName = (opts = {}) => {
  const { min = 2, max = 50, label = 'Name', required = true, validateChars = true } = opts;
  let s = Yup.string()
    .trim()
    .min(min, `${label} must be at least ${min} characters`)
    .max(max, `${label} must not exceed ${max} characters`);
  if (validateChars) {
    s = s.matches(REGEX.NAME, `${label} can only contain letters, spaces, hyphens and apostrophes`);
  }
  return required ? s.required(`${label} is required`) : s.nullable().notRequired();
};

// ── Username ───────────────────────────────────────────────────────────────────

/**
 * @param {boolean} required
 */
export const yupUsername = (required = true) => {
  let s = Yup.string()
    .trim()
    .lowercase()
    .min(3,  'Username must be at least 3 characters')
    .max(30, 'Username must not exceed 30 characters')
    .matches(REGEX.USERNAME, 'Only lowercase letters, numbers, dots, hyphens and underscores');
  return required ? s.required('Username is required') : s.nullable().notRequired();
};

// ── Date de naissance ──────────────────────────────────────────────────────────

/**
 * @param {{ minAge?: number, maxAge?: number, required?: boolean }} opts
 */
export const yupDateOfBirth = (opts = {}) => {
  const { minAge, maxAge, required = false } = opts;

  let s = Yup.date()
    .typeError('Please enter a valid date')
    .max(new Date(), 'Date of birth cannot be in the future');

  if (minAge != null) {
    s = s.test('min-age', `Must be at least ${minAge} years old`, (value) => {
      if (!value) return true;
      const cutoff = new Date();
      cutoff.setFullYear(cutoff.getFullYear() - minAge);
      return value <= cutoff;
    });
  }

  if (maxAge != null) {
    s = s.test('max-age', `Age cannot exceed ${maxAge} years`, (value) => {
      if (!value) return true;
      const cutoff = new Date();
      cutoff.setFullYear(cutoff.getFullYear() - maxAge);
      return value >= cutoff;
    });
  }

  return required ? s.required('Date of birth is required') : s.nullable().notRequired();
};
