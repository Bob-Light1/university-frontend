import * as Yup from 'yup';
import i18n from '../i18n/i18n';
import { yupEmail, yupPassword, yupConfirmPassword, yupPhone } from '../utils/validationRules';

/**
 * Campus creation schema (admin portal).
 * Messages are lazy thunks so a language switch is reflected on the next
 * validation pass — see validationRules.js for the rationale.
 */
export const createCampusSchema = Yup.object({
  campus_name: Yup.string()
    .trim()
    .min(4, () => i18n.t('errors:validation.campusNameMin', { min: 4 }))
    .required(() => i18n.t('errors:validation.campusNameRequired')),

  campus_number: Yup.string().trim().nullable(),

  manager_name: Yup.string()
    .trim()
    .min(6, () => i18n.t('errors:validation.managerNameMin', { min: 6 }))
    .required(() => i18n.t('errors:validation.managerNameRequired')),

  manager_phone: yupPhone(true),

  email: yupEmail(),

  campus_image: Yup.string().nullable(),

  password:         yupPassword(),
  confirm_password: yupConfirmPassword('password'),

  location: Yup.object({
    address: Yup.string().trim().nullable(),

    city: Yup.string().trim().nullable(),

    country: Yup.string().trim().default('Cameroun'),

    coordinates: Yup.object({
      lat: Yup.number()
        .min(-90, () => i18n.t('errors:validation.latitudeRange'))
        .max(90,  () => i18n.t('errors:validation.latitudeRange'))
        .nullable(),
      lng: Yup.number()
        .min(-180, () => i18n.t('errors:validation.longitudeRange'))
        .max(180,  () => i18n.t('errors:validation.longitudeRange'))
        .nullable(),
    }).nullable(),
  }).nullable(),
});
