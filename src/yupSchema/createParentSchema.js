import * as Yup from 'yup';
import {
  yupEmail, yupPhone, yupName, yupDateOfBirth,
} from '../utils/validationRules';

/**
 * Parent create/edit validation. Password is never set here (account
 * activation lets the user choose their own).
 */
export const createParentSchema = () =>
  Yup.object().shape({
    // ── Informations personnelles ─────────────────────────────────────────────

    firstName: yupName({ label: 'First name' }),
    lastName:  yupName({ label: 'Last name'  }),

    email: yupEmail({ required: false }),
    phone: yupPhone(true),

    // Account activation: the user sets their own password — never set here.
    password: Yup.string().notRequired(),

    gender: Yup.string()
      .oneOf(['male', 'female'], 'Please select a valid gender')
      .required('Gender is required'),

    relationship: Yup.string()
      .oneOf(
        ['father', 'mother', 'guardian', 'other'],
        "Must be 'father', 'mother', 'guardian', or 'other'"
      )
      .required('Relationship is required'),

    // ── Champs optionnels ─────────────────────────────────────────────────────

    dateOfBirth: yupDateOfBirth(),

    nationalId: Yup.string()
      .trim()
      .max(50, 'National ID must not exceed 50 characters')
      .nullable()
      .notRequired(),

    occupation: Yup.string()
      .trim()
      .max(100, 'Occupation must not exceed 100 characters')
      .nullable()
      .notRequired(),

    preferredLanguage: Yup.string()
      .oneOf(['en', 'fr', 'es', 'ar', 'zh-CN', 'de'], 'Invalid language')
      .notRequired(),

    notes: Yup.string()
      .max(500, 'Notes must not exceed 500 characters')
      .nullable()
      .notRequired(),

    schoolCampus: Yup.string().required('Campus is required'),

    children: Yup.array()
      .of(Yup.string())
      .max(10, 'A parent can be linked to at most 10 children')
      .notRequired(),
  });

export default createParentSchema;
