/** @file admissionEnrollmentSchema.js @description Student requirements mirrored from the backend for admission finalization. */
import * as Yup from 'yup';

/** Validate real identity data; no default birth date, gender or class is invented. */
export const admissionEnrollmentSchema = (t) => {
  const required = t('admission.required');
  const invalid = t('admission.invalid');
  return Yup.object({
    firstName: Yup.string().trim().min(2, invalid).max(50, invalid).required(required),
    lastName: Yup.string().trim().min(2, invalid).max(50, invalid).required(required),
    username: Yup.string().trim().min(3, invalid).max(30, invalid).matches(/^[a-z0-9_.-]+$/, invalid).required(required),
    phone: Yup.string().matches(/^\+?[0-9\s()-]{6,20}$/, invalid).required(required),
    dateOfBirth: Yup.date().typeError(invalid).max(new Date(), invalid).required(required),
    gender: Yup.string().oneOf(['male', 'female'], invalid).required(required),
    studentClass: Yup.string().matches(/^[a-f\d]{24}$/i, invalid).required(required),
  });
};
