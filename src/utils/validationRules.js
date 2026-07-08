/**
 * @file validationRules.js
 * @description Single source of truth for every user-facing validation rule.
 *
 * Exports reusable Yup field builders and REGEX constants. Usage in Yup schemas:
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
 * Uniform password policy (all user types):
 *   >=8 chars, >=1 lowercase, >=1 uppercase, >=1 digit, >=1 symbol, no spaces
 *
 * i18n: every message is a lazy thunk resolved by Yup at validation time, not at
 * module evaluation time. Schemas built at module scope (the common case) would
 * otherwise freeze their messages to whatever language was active on first import
 * and never follow a language switch. Keys live in the `errors` namespace, which
 * i18n.js loads eagerly, so no namespace has to be awaited here.
 */

import * as Yup from 'yup';
import i18n from '../i18n/i18n';

/**
 * @param {string} key   Key under `errors:validation.`
 * @param {Object} [vars] ICU interpolation values
 */
const tErr = (key, vars) => i18n.t(`errors:validation.${key}`, vars);

// ── Regex constants ────────────────────────────────────────────────────────────

export const REGEX = {
  EMAIL:     /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,

  // E.164-like: "+" followed by 7–19 digits (the format <PhoneInput /> produces)
  PHONE:     /^\+[0-9]{7,19}$/,

  // Names (accents, spaces, hyphens, apostrophes)
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
    .max(maxLength, () => tErr('emailMax', { max: maxLength }))
    .matches(REGEX.EMAIL, () => tErr('email'));
  return required ? s.required(() => tErr('emailRequired')) : s.nullable().notRequired();
};

// ── Password ───────────────────────────────────────────────────────────────────

/**
 * Full password field — creation and change-password forms.
 * @param {{ required?: boolean, isEdit?: boolean }} opts
 *   isEdit: true → fully optional (empty = leave unchanged)
 */
export const yupPassword = (opts = {}) => {
  const { required = true, isEdit = false } = opts;
  if (isEdit) return Yup.string().notRequired();

  let s = Yup.string()
    .min(8,   () => tErr('passwordMin', { min: 8 }))
    .max(128, () => tErr('passwordMax', { max: 128 }))
    .matches(REGEX.PW_LOWER,  () => tErr('passwordLower'))
    .matches(REGEX.PW_UPPER,  () => tErr('passwordUpper'))
    .matches(REGEX.PW_DIGIT,  () => tErr('passwordDigit'))
    .matches(REGEX.PW_SYMBOL, () => tErr('passwordSymbol'))
    .test('no-spaces', () => tErr('passwordNoSpaces'), (v) => !v || !/\s/.test(v));

  return required ? s.required(() => tErr('passwordRequired')) : s.notRequired();
};

/**
 * Login password field — presence only, no format rules.
 * Enforcing the current policy at login would lock out legacy accounts.
 */
export const yupPasswordLogin = () =>
  Yup.string()
    .min(1, () => tErr('passwordRequired'))
    .required(() => tErr('passwordRequired'));

/**
 * Password confirmation.
 * @param {string} refField — name of the password field to match (default: 'password')
 */
export const yupConfirmPassword = (refField = 'password') =>
  Yup.string()
    .oneOf([Yup.ref(refField)], () => tErr('passwordMatch'))
    .required(() => tErr('passwordConfirmRequired'));

// ── Phone ──────────────────────────────────────────────────────────────────────

/**
 * Phone field — validates the E.164-like format produced by <PhoneInput />.
 * Stored value: "+237612345678" (no spaces or parentheses).
 *
 * In forms, use the <PhoneInput /> component with:
 *   onChange={(v) => formik.setFieldValue('phone', v)}
 *
 * @param {boolean} required
 */
export const yupPhone = (required = false) => {
  let s = Yup.string()
    .trim()
    .matches(REGEX.PHONE, () => tErr('phoneFormat'));
  return required ? s.required(() => tErr('phoneRequired')) : s.nullable().notRequired();
};

// ── Names ──────────────────────────────────────────────────────────────────────

/**
 * @param {{ min?: number, max?: number, label?: string, required?: boolean, validateChars?: boolean }} opts
 *   label: already-translated field name interpolated into the message.
 *   validateChars: false → skip the character regex (for free-form names)
 */
export const yupName = (opts = {}) => {
  const { min = 2, max = 50, label, required = true, validateChars = true } = opts;
  const fieldLabel = () => label ?? i18n.t('common:field.name');

  let s = Yup.string()
    .trim()
    .min(min, () => tErr('nameMin', { label: fieldLabel(), min }))
    .max(max, () => tErr('nameMax', { label: fieldLabel(), max }));
  if (validateChars) {
    s = s.matches(REGEX.NAME, () => tErr('nameChars', { label: fieldLabel() }));
  }
  return required
    ? s.required(() => tErr('nameRequired', { label: fieldLabel() }))
    : s.nullable().notRequired();
};

// ── Username ───────────────────────────────────────────────────────────────────

/**
 * @param {boolean} required
 */
export const yupUsername = (required = true) => {
  let s = Yup.string()
    .trim()
    .lowercase()
    .min(3,  () => tErr('usernameMin', { min: 3 }))
    .max(30, () => tErr('usernameMax', { max: 30 }))
    .matches(REGEX.USERNAME, () => tErr('usernameFormat'));
  return required ? s.required(() => tErr('usernameRequired')) : s.nullable().notRequired();
};

// ── Date of birth ──────────────────────────────────────────────────────────────

/**
 * @param {{ minAge?: number, maxAge?: number, required?: boolean }} opts
 */
export const yupDateOfBirth = (opts = {}) => {
  const { minAge, maxAge, required = false } = opts;

  let s = Yup.date()
    .typeError(() => tErr('dobInvalid'))
    .max(new Date(), () => tErr('dobFuture'));

  if (minAge != null) {
    s = s.test('min-age', () => tErr('dobMinAge', { minAge }), (value) => {
      if (!value) return true;
      const cutoff = new Date();
      cutoff.setFullYear(cutoff.getFullYear() - minAge);
      return value <= cutoff;
    });
  }

  if (maxAge != null) {
    s = s.test('max-age', () => tErr('dobMaxAge', { maxAge }), (value) => {
      if (!value) return true;
      const cutoff = new Date();
      cutoff.setFullYear(cutoff.getFullYear() - maxAge);
      return value >= cutoff;
    });
  }

  return required ? s.required(() => tErr('dobRequired')) : s.nullable().notRequired();
};
