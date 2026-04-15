import * as yup from 'yup';

export const createCampusSchema = yup.object({
  campus_name: yup
    .string()
    .trim()
    .min(4, 'Campus name must contain at least 4 characters.')
    .required('Campus name is required.'),

  campus_number: yup
    .string()
    .trim()
    .nullable(),

  manager_name: yup
    .string()
    .trim()
    .min(6, 'Manager name must be at least 6 characters long.')
    .required('Manager name is required.'),

  manager_phone: yup
    .string()
    .trim()
    .matches(
      /^\+?[0-9\s]{6,20}$/,
      'Invalid phone number format.'
    )
    .required('Manager phone number is required.'),

  email: yup
    .string()
    .trim()
    .lowercase()
    .email('Please enter a valid email.')
    .required('Manager email is required.'),

  campus_image: yup
    .string()
    .nullable(),

  password: yup
    .string()
    .min(8, 'Password must contain at least 8 characters.')
    .matches(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
      'Password must contain at least one number, one uppercase and one lowercase letter.'
    )
    .required('Password is required.'),

  confirm_password: yup
    .string()
    .oneOf([yup.ref('password')], 'Confirm password must match password.')
    .required('Confirm password is required.'),

  location: yup.object({
    address: yup
      .string()
      .trim()
      .nullable(),

    city: yup
      .string()
      .trim()
      .nullable(),

    country: yup
      .string()
      .trim()
      .default('Cameroun'),

    coordinates: yup.object({
      lat: yup
        .number()
        .min(-90, 'Latitude must be between -90 and 90')
        .max(90, 'Latitude must be between -90 and 90')
        .nullable(),

      lng: yup
        .number()
        .min(-180, 'Longitude must be between -180 and 180')
        .max(180, 'Longitude must be between -180 and 180')
        .nullable(),
    }).nullable(),
  }).nullable(),
});
