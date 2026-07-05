import * as Yup from 'yup';

export const createSubjectSchema = Yup.object().shape({
  // schoolCampus: Campus ID is required
  schoolCampus: Yup.string()
    .required('Campus is required')
    .matches(/^[0-9a-fA-F]{24}$/, 'Invalid campus ID'),

  // department: Optional department the subject belongs to (must be in the campus)
  department: Yup.string()
    .matches(/^[0-9a-fA-F]{24}$/, {
      message: 'Invalid department ID',
      excludeEmptyString: true,
    })
    .nullable(),

  // subject_name: Subject name
  subject_name: Yup.string()
    .trim()
    .min(2, 'Subject name must be at least 2 characters')
    .max(100, 'Subject name must not exceed 100 characters')
    .required('Subject name is required'),

  // subject_code: Unique code per campus
  subject_code: Yup.string()
    .trim()
    .uppercase()
    .min(2, 'Subject code must be at least 2 characters')
    .max(20, 'Subject code must not exceed 20 characters')
    .matches(
      /^[A-Z0-9]+$/,
      'Subject code can only contain uppercase letters and numbers'
    )
    .required('Subject code is required'),

  // description: Optional description
  description: Yup.string()
    .max(500, 'Description must not exceed 500 characters')
    .nullable(),

  // coefficient: For grade calculations
  coefficient: Yup.number()
    .typeError('Coefficient must be a number')
    .min(0, 'Coefficient cannot be negative')
    .max(10, 'Coefficient cannot exceed 10')
    .default(1),

  // color: Hex color for UI
  color: Yup.string()
    .matches(
      /^#[0-9A-Fa-f]{6}$/,
      'Color must be in hex format (e.g., #FF5733)'
    )
    .default('#1976d2')
    .nullable(),

  // category: Optional grouping
  category: Yup.string()
    .oneOf(
      [
        'Science',
        'Mathematics',
        'Languages',
        'Social Studies',
        'Arts',
        'Physical Education',
        'Technology',
        'Other'
      ],
      'Invalid category'
    )
    .default('Other')
    .nullable(),
});