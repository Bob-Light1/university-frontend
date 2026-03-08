import * as Yup from 'yup';

/**
 * Yup validation schema for Teacher creation / update form.
 *
 * @param {boolean} isEdit - true when editing an existing teacher record
 */
export const createTeacherSchema = (isEdit = false) =>
  Yup.object().shape({
    // ── Personal information ──────────────────────────────────────────────────

    firstName: Yup.string()
      .trim()
      .min(2, 'First name must be at least 2 characters')
      .max(50, 'First name must not exceed 50 characters')
      .required('First name is required'),

    lastName: Yup.string()
      .trim()
      .min(2, 'Last name must be at least 2 characters')
      .max(50, 'Last name must not exceed 50 characters')
      .required('Last name is required'),

    email: Yup.string()
      .trim()
      .lowercase()
      .email('Invalid email address')
      .required('Email is required'),

    username: Yup.string()
      .trim()
      .lowercase()
      .min(3, 'Username must be at least 3 characters')
      .max(30, 'Username must not exceed 30 characters')
      .matches(
        /^[a-z0-9_.-]+$/,
        'Username can only contain lowercase letters, numbers, dots, hyphens and underscores'
      )
      .required('Username is required'),

    password: isEdit
      ? Yup.string().notRequired()
      : Yup.string()
          .min(8, 'Password must be at least 8 characters')
          .matches(/[A-Z]/, 'Password must contain at least one uppercase letter')
          .matches(/[a-z]/, 'Password must contain at least one lowercase letter')
          .matches(/[0-9]/, 'Password must contain at least one number')
          .matches(
            /[!@#$%^&*(),.?":{}|<>]/,
            'Password must contain at least one special character'
          )
          .required('Password is required'),

    phone: Yup.string()
      .trim()
      .matches(
        /^\+?[0-9\s()-]{6,20}$/,
        'Please enter a valid phone number'
      )
      .required('Phone number is required'),

    gender: Yup.string()
      .oneOf(['male', 'female', 'other'], 'Please select a valid gender')
      .required('Gender is required'),

    dateOfBirth: Yup.date()
      .nullable()
      .max(new Date(), 'Date of birth cannot be in the future')
      .typeError('Please enter a valid date'),

    // ── Professional information ──────────────────────────────────────────────

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

    // ── Academic assignment ───────────────────────────────────────────────────

    department: Yup.string().required('Department is required'),

    /**
     * Classes the teacher is assigned to teach.
     * Optional array of class ObjectIds (strings from the select/chips UI).
     * All class IDs must belong to the same campus — enforced by the backend.
     */
    classes: Yup.array()
      .of(Yup.string().required())
      .notRequired()
      .default([]),

    /**
     * Optional: ID of the class for which this teacher is the classManager.
     * Must be one of the classes already selected in `classes[]`.
     * Backend enforces campus isolation and sets Class.classManager accordingly.
     */
    classManagerOf: Yup.string()
      .nullable()
      .notRequired()
      .test(
        'classManager-in-classes',
        'The managed class must be one of the assigned classes',
        function (value) {
          if (!value) return true; // optional — null/empty is fine
          const { classes = [] } = this.parent;
          return classes.includes(value);
        }
      ),

    matricule: Yup.string()
      .trim()
      .uppercase()
      .notRequired(),

    schoolCampus: Yup.string().required('Campus is required'),

    profileImage: Yup.mixed().nullable().notRequired(),
  });