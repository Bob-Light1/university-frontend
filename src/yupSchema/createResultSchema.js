'use strict';

/**
 * @file createResultSchema.js
 * @description Yup validation schemas for academic result forms.
 *              Mirrors result.model.js — covers creation, audit corrections,
 *              status transitions, and justification workflows.
 */

import * as Yup from 'yup';

// ─── CONSTANTS ────────────────────────────────────────────────────────────────

export const RESULT_STATUS   = ['DRAFT', 'SUBMITTED', 'PUBLISHED', 'ARCHIVED'];
export const EVALUATION_TYPE = ['CC', 'EXAM', 'RETAKE', 'PROJECT', 'PRACTICAL'];
export const EXAM_PERIOD     = ['Midterm', 'Final', 'Quiz', 'Assignment', 'Project', 'Practical'];
export const EXAM_ATTENDANCE = ['present', 'absent', 'excused'];
export const SEMESTER        = ['S1', 'S2', 'Annual'];

const OBJECT_ID_REGEX    = /^[a-f\d]{24}$/i;
const ACADEMIC_YEAR_REGEX = /^\d{4}-\d{4}$/;

// ─── REUSABLE HELPERS ─────────────────────────────────────────────────────────

const objectId = (label = 'ID') =>
  Yup.string()
    .matches(OBJECT_ID_REGEX, `${label} must be a valid identifier`)
    .required(`${label} is required`);

const optionalObjectId = (label = 'ID') =>
  Yup.string()
    .matches(OBJECT_ID_REGEX, `${label} must be a valid identifier`)
    .nullable()
    .default(null);

const academicYearField = Yup.string()
  .matches(ACADEMIC_YEAR_REGEX, 'Academic year must be in YYYY-YYYY format (e.g. 2024-2025)')
  .test(
    'consecutive-years',
    'Academic year must span exactly one year (e.g. 2024-2025)',
    (value) => {
      if (!value) return true;
      const [start, end] = value.split('-').map(Number);
      return end === start + 1;
    }
  )
  .required('Academic year is required');

// ─── MAIN CREATE SCHEMA ───────────────────────────────────────────────────────

/**
 * Full schema for the result creation form.
 *
 * Score validations are attached directly to the `score` field so that
 * error messages appear under the correct input in the UI — not under
 * a phantom field like scoreValidation.
 *
 * Two rules enforced on score:
 *  1. score must not exceed maxScore.
 *  2. score must be 0 when examAttendance is 'absent' (mirrors model pre-save).
 */
export const createResultSchema = Yup.object({
  // schoolCampus is optional at the form level:
  // - CAMPUS_MANAGER / TEACHER: enforced from JWT on the backend via resolveCampusId()
  // - ADMIN / DIRECTOR: may not have a campusId in their JWT; they pass it in the body
  //   or the backend resolves it from the class document.
  // Making it required here would silently block submit for ADMIN/DIRECTOR.
  schoolCampus: optionalObjectId('Campus'),

  academicYear: academicYearField,

  semester: Yup.string()
    .oneOf(SEMESTER, 'Semester must be S1, S2, or Annual')
    .required('Semester is required'),

  evaluationType: Yup.string()
    .oneOf(EVALUATION_TYPE, 'Invalid evaluation type')
    .required('Evaluation type is required'),

  evaluationTitle: Yup.string()
    .trim()
    .min(2, 'Evaluation title must be at least 2 characters')
    .max(200, 'Evaluation title must not exceed 200 characters')
    .required('Evaluation title is required'),

  examDate: Yup.date()
    .typeError('Exam date must be a valid date')
    .max(new Date(), 'Exam date cannot be in the future')
    .nullable()
    .default(null),

  examPeriod: Yup.string()
    .oneOf(EXAM_PERIOD, 'Invalid exam period')
    .nullable()
    .default(null),

  student: objectId('Student'),
  class:   objectId('Class'),
  subject: objectId('Subject'),
  teacher: objectId('Teacher'),

  maxScore: Yup.number()
    .typeError('Max score must be a number')
    .min(1, 'Max score must be at least 1')
    .required('Max score is required'),

  /**
   * All score constraints live here — errors appear directly under the score
   * input in the form rather than on a phantom validation field.
   */
  score: Yup.number()
    .typeError('Score must be a number')
    .min(0, 'Score cannot be negative')
    .required('Score is required')
    .test(
      'score-not-above-max',
      'Score cannot exceed the maximum score',
      function (value) {
        const { maxScore } = this.parent;
        if (value == null || maxScore == null) return true;
        return value <= maxScore;
      }
    )
    .test(
      'absent-score-must-be-zero',
      'Score must be 0 when the student is marked as absent',
      function (value) {
        const { examAttendance } = this.parent;
        if (examAttendance === 'absent' && value !== 0) return false;
        return true;
      }
    ),

  coefficient: Yup.number()
    .min(0, 'Coefficient cannot be negative')
    .default(1),

  gradingScale: optionalObjectId('Grading scale'),

  examAttendance: Yup.string()
    .oneOf(EXAM_ATTENDANCE, 'Exam attendance must be present, absent, or excused')
    .default('present'),

  specialCircumstances: Yup.string()
    .trim()
    .max(300, 'Special circumstances must not exceed 300 characters')
    .nullable()
    .default(null),

  teacherRemarks: Yup.string()
    .trim()
    .max(1000, 'Teacher remarks must not exceed 1000 characters')
    .nullable()
    .default(null),

  strengths: Yup.string()
    .trim()
    .max(500, 'Strengths must not exceed 500 characters')
    .nullable()
    .default(null),

  improvements: Yup.string()
    .trim()
    .max(500, 'Improvements must not exceed 500 characters')
    .nullable()
    .default(null),

  retakeOf: optionalObjectId('Original result'),

  status: Yup.string().oneOf(RESULT_STATUS).default('DRAFT'),
});

// ─── UPDATE / EDIT SCHEMA ─────────────────────────────────────────────────────

export const updateResultSchema = Yup.object({
  evaluationTitle: Yup.string().trim().min(2).max(200).nullable(),
  examDate:        Yup.date().typeError('Invalid date').max(new Date(), 'Exam date cannot be in the future').nullable(),
  examPeriod:      Yup.string().oneOf(EXAM_PERIOD).nullable(),
  examAttendance:  Yup.string().oneOf(EXAM_ATTENDANCE).nullable(),

  maxScore: Yup.number().min(1, 'Max score must be at least 1').nullable(),

  // Score validation reuses the same cross-field tests on partial update
  score: Yup.number()
    .min(0, 'Score cannot be negative')
    .nullable()
    .test('score-not-above-max', 'Score cannot exceed the maximum score', function (value) {
      const { maxScore } = this.parent;
      if (value == null || maxScore == null) return true;
      return value <= maxScore;
    })
    .test('absent-score-must-be-zero', 'Score must be 0 when the student is marked as absent', function (value) {
      const { examAttendance } = this.parent;
      if (examAttendance === 'absent' && value !== 0) return false;
      return true;
    }),

  coefficient:          Yup.number().min(0).nullable(),
  teacherRemarks:       Yup.string().trim().max(1000).nullable(),
  strengths:            Yup.string().trim().max(500).nullable(),
  improvements:         Yup.string().trim().max(500).nullable(),
  specialCircumstances: Yup.string().trim().max(300).nullable(),
});

// ─── STATUS TRANSITION SCHEMA ─────────────────────────────────────────────────

/**
 * Workflow transitions: DRAFT → SUBMITTED → PUBLISHED → ARCHIVED.
 * Backward transitions (e.g. PUBLISHED → DRAFT) are blocked at the
 * controller / service layer, not here, since Yup does not have access
 * to the current document state.
 */
export const updateResultStatusSchema = Yup.object({
  status: Yup.string()
    .oneOf(RESULT_STATUS, 'Invalid result status')
    .required('Status is required'),
  reason: Yup.string()
    .trim()
    .max(500, 'Reason must not exceed 500 characters')
    .when('status', {
      is:   'ARCHIVED',
      then: (s) => s.required('A reason is required when archiving a result'),
    }),
});

// ─── AUDIT CORRECTION SCHEMA ──────────────────────────────────────────────────

export const auditCorrectionSchema = Yup.object({
  field: Yup.string()
    .trim()
    .required('The field being corrected is required'),
  newValue: Yup.mixed()
    .required('New value is required'),
  reason: Yup.string()
    .trim()
    .min(10, 'Audit reason must be at least 10 characters')
    .max(500, 'Audit reason must not exceed 500 characters')
    .required('An audit reason is mandatory for post-publication corrections'),
});

// ─── BULK CREATE SCHEMA ───────────────────────────────────────────────────────

/**
 * Per-student entry in a bulk grade import.
 * The score is validated against the parent maxScore using a .test()
 * because Yup.ref cannot traverse upward out of array items.
 */
const bulkResultEntrySchema = Yup.object({
  studentId: objectId('Student'),

  score: Yup.number()
    .min(0, 'Score cannot be negative')
    .required('Score is required')
    .test(
      'score-not-above-max',
      'Score cannot exceed the maximum score for this evaluation',
      function (value) {
        // Walk up to the parent context to retrieve the shared maxScore
        const maxScore = this.options?.context?.maxScore;
        if (value == null || maxScore == null) return true;
        return value <= maxScore;
      }
    )
    .test(
      'absent-score-must-be-zero',
      'Score must be 0 when the student is marked as absent',
      function (value) {
        const { examAttendance } = this.parent;
        if (examAttendance === 'absent' && value !== 0) return false;
        return true;
      }
    ),

  examAttendance: Yup.string().oneOf(EXAM_ATTENDANCE).default('present'),
  teacherRemarks: Yup.string().trim().max(1000).nullable().default(null),
});

/**
 * Bulk grade entry schema.
 * Pass { context: { maxScore } } to schema.validate() so that the per-entry
 * score test can access the shared maximum.
 *
 * Example:
 *   bulkCreateResultSchema.validate(payload, { context: { maxScore: payload.maxScore } })
 */
export const bulkCreateResultSchema = Yup.object({
  // Optional — see createResultSchema comment above
  schoolCampus:    optionalObjectId('Campus'),
  academicYear:    academicYearField,
  semester:        Yup.string().oneOf(SEMESTER).required('Semester is required'),
  evaluationType:  Yup.string().oneOf(EVALUATION_TYPE).required('Evaluation type is required'),
  evaluationTitle: Yup.string().trim().min(2).max(200).required('Evaluation title is required'),
  class:           objectId('Class'),
  subject:         objectId('Subject'),
  teacher:         objectId('Teacher'),

  maxScore: Yup.number()
    .min(1, 'Max score must be at least 1')
    .required('Max score is required'),

  coefficient: Yup.number().min(0).default(1),
  examDate:    Yup.date().typeError('Invalid date').max(new Date(), 'Exam date cannot be in the future').nullable().default(null),
  examPeriod:  Yup.string().oneOf(EXAM_PERIOD).nullable().default(null),

  entries: Yup.array()
    .of(bulkResultEntrySchema)
    .min(1, 'At least one result entry is required')
    .required('Entries are required'),
});

// ─── CLASS MANAGER REMARKS SCHEMA ────────────────────────────────────────────

export const classManagerRemarksSchema = Yup.object({
  classManagerRemarks: Yup.string()
    .trim()
    .min(5, 'Remarks must be at least 5 characters')
    .max(1000, 'Remarks must not exceed 1000 characters')
    .required('Remarks are required'),
  classManager: objectId('Class manager'),
});

export default createResultSchema;