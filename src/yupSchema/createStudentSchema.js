import * as Yup from 'yup';
import {
  yupEmail, yupPassword, yupPhone, yupName, yupUsername, yupDateOfBirth,
} from '../utils/validationRules';

/**
 * @param {boolean} isEdit - true lors de l'édition d'un étudiant existant
 */
export const createStudentSchema = (isEdit = false) =>
  Yup.object().shape({
    // ── Affectation académique ────────────────────────────────────────────────

    schoolCampus:  Yup.string().required('Campus selection is required'),
    studentClass:  Yup.string().required('Class selection is required'),

    // ── Informations personnelles ─────────────────────────────────────────────

    firstName: yupName({ label: 'First name' }),
    lastName:  yupName({ label: 'Last name'  }),

    username: yupUsername(false), // optionnel pour les étudiants

    gender: Yup.string()
      .oneOf(['male', 'female'], 'Please select a valid gender')
      .required('Gender is required'),

    // ── Contact ───────────────────────────────────────────────────────────────

    email: yupEmail({ required: false }),
    phone: yupPhone(true),

    // ── Champs optionnels ─────────────────────────────────────────────────────

    mentor: Yup.string().nullable(),

    dateOfBirth: yupDateOfBirth({ minAge: 10, maxAge: 80 }),

    // ── Mot de passe ──────────────────────────────────────────────────────────

    password: yupPassword({ isEdit }),

    // ── Matricule (auto-généré si omis) ───────────────────────────────────────

    matricule: Yup.string().trim().uppercase().notRequired(),

    // ── Contact d'urgence (optionnel) ─────────────────────────────────────────

    emergencyContactName: Yup.string()
      .trim()
      .max(100, 'Contact name must not exceed 100 characters')
      .notRequired(),

    emergencyContactPhone: yupPhone(false),

    emergencyContactRelation: Yup.string()
      .trim()
      .max(50, 'Relationship must not exceed 50 characters')
      .notRequired(),
  });
