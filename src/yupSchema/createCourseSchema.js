/**
 * @file createCourseSchema.js
 * @description Yup validation schemas for the course catalog forms.
 *
 * Mirrors exactly the Mongoose constraints defined in course.model.js:
 *  - courseCode: uppercase alphanumeric + dashes, 2–30 chars
 *  - title: 3–150 chars
 *  - category: enum COURSE_CATEGORY
 *  - level: required ObjectId string
 *  - languages: at least one value from LANGUAGE_CODES
 *  - objectives: max 10, each max 300 chars
 *  - tags: max 15, each max 30 chars
 *  - syllabus: max 60 units
 *  - prerequisites: max 10, no self-reference (checked at controller level)
 *  - estimatedWorkload: non-negative numbers
 *  - durationWeeks: 0–104
 *  - creditHours: 0–30
 *
 * Exports:
 *  createCourseSchema(isApproved)  — full form schema
 *    isApproved: when true, pedagogical fields (title, objectives, syllabus,
 *    creditHours) are relaxed to optional to allow APPROVED-course edits
 *    (non-pedagogical fields only).
 *
 *  syllabusUnitSchema  — reusable sub-schema for a single syllabus entry
 *  prerequisiteSchema  — reusable sub-schema for a single prerequisite entry
 *  resourceSchema      — reusable sub-schema for the add-resource dialog
 */

import * as Yup from 'yup';

// ─── ENUMS (must stay in sync with course.model.js) ──────────────────────────

const COURSE_CATEGORY    = ['Core', 'Elective', 'Remedial', 'Advanced', 'Professional', 'General'];
const COURSE_DIFFICULTY  = ['BEGINNER', 'INTERMEDIATE', 'ADVANCED', 'EXPERT'];
const COURSE_VISIBILITY  = ['PUBLIC', 'INTERNAL', 'RESTRICTED'];
const LANGUAGE_CODES     = ['fr', 'en', 'es', 'ar', 'pt', 'de', 'zh', 'other'];
const SESSION_TYPES      = ['LECTURE', 'TUTORIAL', 'PRACTICAL', 'EXAM', 'WORKSHOP'];
const PERIOD_TYPES       = ['week', 'session', 'module', 'chapter'];
const PREREQUISITE_TYPES = ['REQUIRED', 'RECOMMENDED'];
const RESOURCE_TYPES     = ['PDF', 'VIDEO', 'LINK', 'DOCUMENT', 'SPREADSHEET', 'OTHER'];

// ─── SUB-SCHEMAS ──────────────────────────────────────────────────────────────

/**
 * Single syllabus unit.
 * Mirrors SyllabusUnitSchema in course.model.js.
 */
export const syllabusUnitSchema = Yup.object({
  periodNumber: Yup.number()
    .typeError('Period number must be a number')
    .required('Period number is required')
    .integer('Period number must be an integer')
    .min(1, 'Minimum period number is 1')
    .max(60, 'Maximum period number is 60'),

  periodType: Yup.string()
    .required('Period type is required')
    .oneOf(PERIOD_TYPES, 'Invalid period type'),

  title: Yup.string()
    .required('Unit title is required')
    .trim()
    .max(150, 'Unit title must not exceed 150 characters'),

  content: Yup.string()
    .trim()
    .max(1000, 'Content must not exceed 1000 characters'),

  sessionType: Yup.string()
    .oneOf(SESSION_TYPES, 'Invalid session type'),

  estimatedHours: Yup.number()
    .typeError('Estimated hours must be a number')
    .min(0.5, 'Minimum estimated hours is 0.5')
    .max(20, 'Maximum estimated hours is 20')
    .nullable()
    .transform((value, originalValue) =>
      originalValue === '' || originalValue == null ? null : value,
    ),
});

/**
 * Single prerequisite entry.
 * Mirrors PrerequisiteSchema in course.model.js.
 * Self-reference detection is handled server-side in the BFS pre-save hook.
 */
export const prerequisiteSchema = Yup.object({
  course: Yup.string()
    .required('Prerequisite course is required')
    .matches(/^[a-f\d]{24}$/i, 'Invalid course ID format'),

  type: Yup.string()
    .required('Prerequisite type is required')
    .oneOf(PREREQUISITE_TYPES, 'Invalid prerequisite type'),
});

/**
 * Resource sub-document used in the add-resource dialog.
 * Mirrors ResourceSchema in course.model.js.
 */
export const resourceSchema = Yup.object({
  title: Yup.string()
    .required('Resource title is required')
    .trim()
    .max(200, 'Resource title must not exceed 200 characters'),

  type: Yup.string()
    .required('Resource type is required')
    .oneOf(RESOURCE_TYPES, 'Invalid resource type'),

  url: Yup.string()
    .required('Resource URL is required')
    .trim()
    .max(500, 'URL must not exceed 500 characters')
    .test(
      'url-or-relative-path',
      'URL must be a valid absolute URL (https://…) or a relative server path (/uploads/…)',
      (value) => {
        if (!value) return false;
        return /^https?:\/\/.+/i.test(value) || /^\/[^\s]+/.test(value);
      },
    ),

  mimeType: Yup.string()
    .trim()
    .max(100, 'MIME type must not exceed 100 characters'),

  fileSize: Yup.number()
    .min(0, 'File size cannot be negative')
    .nullable()
    .transform((v, o) => (o === '' || o == null ? null : v)),

  isPublic: Yup.boolean().default(true),
});

// ─── WORKLOAD SUB-SCHEMA ──────────────────────────────────────────────────────

const estimatedWorkloadSchema = Yup.object({
  lecture: Yup.number()
    .typeError('Lecture hours must be a number')
    .min(0, 'Cannot be negative')
    .default(0)
    .transform((v, o) => (o === '' || o == null ? 0 : v)),

  practical: Yup.number()
    .typeError('Practical hours must be a number')
    .min(0, 'Cannot be negative')
    .default(0)
    .transform((v, o) => (o === '' || o == null ? 0 : v)),

  selfStudy: Yup.number()
    .typeError('Self-study hours must be a number')
    .min(0, 'Cannot be negative')
    .default(0)
    .transform((v, o) => (o === '' || o == null ? 0 : v)),
});

// ─── MAIN SCHEMA ─────────────────────────────────────────────────────────────

/**
 * Full course form validation schema.
 *
 * @param {boolean} [isApproved=false]
 *   Pass true when editing an APPROVED course.
 *   Pedagogical fields (title, objectives, syllabus, creditHours) become
 *   optional, because the form will hide them (backend will 409 anyway if sent).
 *   Non-pedagogical fields remain fully validated.
 *
 * @returns {Yup.ObjectSchema}
 */
export const createCourseSchema = (isApproved = false) =>
  Yup.object({

    // ── Identification ──────────────────────────────────────────────────────

    courseCode: Yup.string()
      .required('Course code is required')
      .trim()
      .uppercase()
      .matches(
        /^[A-Z0-9\-]{2,30}$/,
        'Course code must be uppercase alphanumeric with dashes (e.g. CS-101)',
      ),

    title: isApproved
      ? Yup.string().trim().max(150, 'Maximum 150 characters')
      : Yup.string()
          .required('Title is required')
          .trim()
          .min(3, 'Title must be at least 3 characters')
          .max(150, 'Title must not exceed 150 characters'),

    // ── Pedagogical classification ───────────────────────────────────────────

    category: Yup.string()
      .required('Category is required')
      .oneOf(COURSE_CATEGORY, 'Invalid category'),

    level: Yup.string()
      .required('Level is required')
      .matches(/^[a-f\d]{24}$/i, 'Invalid level ID format'),

    discipline: Yup.string()
      .trim()
      .max(100, 'Discipline must not exceed 100 characters'),

    languages: Yup.array()
      .of(Yup.string().oneOf(LANGUAGE_CODES, 'Invalid language code'))
      .min(1, 'At least one language is required'),

    difficultyLevel: Yup.string()
      .oneOf(COURSE_DIFFICULTY, 'Invalid difficulty level'),

    visibility: Yup.string()
      .oneOf(COURSE_VISIBILITY, 'Invalid visibility'),

    tags: Yup.array()
      .of(
        Yup.string()
          .trim()
          .max(30, 'Each tag must not exceed 30 characters'),
      )
      .max(15, 'Maximum 15 tags allowed'),

    // ── Pedagogical content ──────────────────────────────────────────────────

    description: Yup.string()
      .trim()
      .max(2000, 'Description must not exceed 2000 characters'),

    objectives: isApproved
      ? Yup.array().of(Yup.string().trim().max(300))
      : Yup.array()
          .of(
            Yup.string()
              .trim()
              .max(300, 'Each objective must not exceed 300 characters'),
          )
          .max(10, 'Maximum 10 objectives allowed'),

    syllabus: isApproved
      ? Yup.array().of(syllabusUnitSchema)
      : Yup.array()
          .of(syllabusUnitSchema)
          .max(60, 'Maximum 60 syllabus units allowed')
          .test(
            'unique-period-numbers',
            'Period numbers must be unique within the syllabus',
            (units) => {
              if (!units || units.length === 0) return true;
              const numbers = units.map((u) => u.periodNumber);
              return new Set(numbers).size === numbers.length;
            },
          ),

    prerequisites: Yup.array()
      .of(prerequisiteSchema)
      .max(10, 'Maximum 10 prerequisites allowed')
      .test(
        'no-duplicate-prerequisites',
        'Duplicate prerequisite courses are not allowed',
        (prereqs) => {
          if (!prereqs || prereqs.length === 0) return true;
          const ids = prereqs.map((p) => p.course).filter(Boolean);
          return new Set(ids).size === ids.length;
        },
      ),

    // ── Workload ─────────────────────────────────────────────────────────────

    durationWeeks: isApproved
      ? Yup.number().min(0).max(104).nullable()
          .transform((v, o) => (o === '' || o == null ? null : v))
      : Yup.number()
          .typeError('Duration must be a number')
          .min(0, 'Duration cannot be negative')
          .max(104, 'Duration cannot exceed 104 weeks')
          .nullable()
          .transform((v, o) => (o === '' || o == null ? null : v)),

    creditHours: isApproved
      ? Yup.number().min(0).max(30).nullable()
          .transform((v, o) => (o === '' || o == null ? null : v))
      : Yup.number()
          .typeError('Credit hours must be a number')
          .min(0, 'Credit hours cannot be negative')
          .max(30, 'Credit hours cannot exceed 30')
          .nullable()
          .transform((v, o) => (o === '' || o == null ? null : v)),

    estimatedWorkload: estimatedWorkloadSchema,
  });