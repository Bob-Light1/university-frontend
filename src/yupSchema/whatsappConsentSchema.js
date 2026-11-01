/** @file whatsappConsentSchema.js @description Mirror of the backend explicit international-phone consent contract. */
import * as Yup from 'yup';
/** Consent is optional; enabling it requires an explicit international number. */
export const whatsappConsentSchema = (t) => Yup.object({
  enabled: Yup.boolean().required(),
  phone: Yup.string().when('enabled', { is: true, then: (schema) => schema.required(t('whatsapp.invalidPhone')).matches(/^\+[1-9]\d{6,14}$/, t('whatsapp.invalidPhone')) }),
});
