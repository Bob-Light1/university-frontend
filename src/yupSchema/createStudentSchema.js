import * as Yup from 'yup';
import {
  yupEmail, yupPhone, yupName, yupUsername, yupDateOfBirth,
} from '../utils/validationRules';

/**
 * Student create/edit validation. Password is never set here (account
 * activation lets the user choose their own).
 */
export const createStudentSchema = () =>
  Yup.object().shape({
    // ── Affectation académique ────────────────────────────────────────────────

    schoolCampus:  Yup.string().required('Campus selection is required'),
    studentClass:  Yup.string().required('Class selection is required'),

    // ── Informations personnelles ─────────────────────────────────────────────

    firstName: yupName({ label: 'First name' }),
    lastName:  yupName({ label: 'Last name'  }),

    username: yupUsername(true), // required: the backend model enforces a unique username (login + activation identity)

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
    // Account activation: the user sets their own password — never set here.

    password: Yup.string().notRequired(),

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
