import * as Yup from 'yup';
import { yupEmail, yupPassword, yupConfirmPassword, yupPhone } from '../utils/validationRules';

export const createCampusSchema = Yup.object({
  campus_name: Yup.string()
    .trim()
    .min(4, 'Campus name must contain at least 4 characters.')
    .required('Campus name is required.'),

  campus_number: Yup.string().trim().nullable(),

  manager_name: Yup.string()
    .trim()
    .min(6, 'Manager name must be at least 6 characters long.')
    .required('Manager name is required.'),

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
        .min(-90,  'Latitude must be between -90 and 90')
        .max(90,   'Latitude must be between -90 and 90')
        .nullable(),
      lng: Yup.number()
        .min(-180, 'Longitude must be between -180 and 180')
        .max(180,  'Longitude must be between -180 and 180')
        .nullable(),
    }).nullable(),
  }).nullable(),
});
