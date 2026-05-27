import * as Yup from 'yup';
import {
  yupEmail, yupPassword, yupPhone, yupName, yupUsername, yupDateOfBirth,
} from '../utils/validationRules';

/**
 * @param {boolean} isEdit - true lors de l'édition d'un enseignant existant
 */
export const createTeacherSchema = (isEdit = false) =>
  Yup.object().shape({
    // ── Informations personnelles ─────────────────────────────────────────────

    firstName: yupName({ label: 'First name' }),
    lastName:  yupName({ label: 'Last name'  }),

    email:    yupEmail(),
    username: yupUsername(true),
    phone:    yupPhone(true),

    password: yupPassword({ isEdit }),

    gender: Yup.string()
      .oneOf(['male', 'female', 'other'], 'Please select a valid gender')
      .required('Gender is required'),

    dateOfBirth: yupDateOfBirth(),

    // ── Informations professionnelles ─────────────────────────────────────────

    qualification: Yup.string()
      .trim()
      .max(100, 'Qualification must not exceed 100 characters')
      .required('Qualification is required'),

    specialization: Yup.string()
      .trim()
      .max(100, 'Specialization must not exceed 100 characters')
      .notRequired(),

    experience: Yup.number()
      .min(0, 'Experience cannot be negative')
      .max(50, 'Experience cannot exceed 50 years')
      .typeError('Experience must be a number')
      .notRequired(),

    employmentType: Yup.string()
      .oneOf(
        ['full-time', 'part-time', 'contract', 'temporary'],
        'Please select a valid employment type'
      )
      .required('Employment type is required'),

    // ── Affectation académique ────────────────────────────────────────────────

    department: Yup.string().required('Department is required'),

    classes: Yup.array()
      .of(Yup.string().required())
      .notRequired()
      .default([]),

    classManagerOf: Yup.string()
      .nullable()
      .notRequired()
      .test(
        'classManager-in-classes',
        'The managed class must be one of the assigned classes',
        function (value) {
          if (!value) return true;
          const { classes = [] } = this.parent;
          return classes.includes(value);
        }
      ),

    matricule:    Yup.string().trim().uppercase().notRequired(),
    schoolCampus: Yup.string().required('Campus is required'),
    profileImage: Yup.mixed().nullable().notRequired(),
  });
