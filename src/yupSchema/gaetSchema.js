/**
 * @file gaetSchema.js
 * @description Yup validation schemas and option constants for GAET forms.
 *
 * Enums are aligned with backend utils/schedule.base.js and gaet-constraint.model.js:
 *   WEEKDAY   = MO TU WE TH FR SA SU
 *   SEMESTER  = S1 | S2 | Annual
 *   SESSION_TYPE = LECTURE | TUTORIAL | PRACTICAL
 *   ROOM_TYPE = CLASSROOM | LAB | AMPHITHEATER
 */

import * as Yup from 'yup';

// ─── OPTION ARRAYS ────────────────────────────────────────────────────────────

export const WEEKDAY_OPTIONS = [
  { value: 'MO', label: 'Monday' },
  { value: 'TU', label: 'Tuesday' },
  { value: 'WE', label: 'Wednesday' },
  { value: 'TH', label: 'Thursday' },
  { value: 'FR', label: 'Friday' },
  { value: 'SA', label: 'Saturday' },
  { value: 'SU', label: 'Sunday' },
];

export const WEEKDAY_LABEL = Object.fromEntries(
  WEEKDAY_OPTIONS.map(({ value, label }) => [value, label])
);

export const SESSION_TYPE_OPTIONS = [
  { value: 'LECTURE',   label: 'Lecture'   },
  { value: 'TUTORIAL',  label: 'Tutorial'  },
  { value: 'PRACTICAL', label: 'Practical' },
];

export const ROOM_TYPE_OPTIONS = [
  { value: 'CLASSROOM',    label: 'Classroom'    },
  { value: 'LAB',          label: 'Lab'          },
  { value: 'AMPHITHEATER', label: 'Amphitheater' },
];

export const SEMESTER_OPTIONS = [
  { value: 'S1',     label: 'Semester 1' },
  { value: 'S2',     label: 'Semester 2' },
  { value: 'Annual', label: 'Annual'     },
];

// ─── HELPERS ──────────────────────────────────────────────────────────────────

const OBJECT_ID_REGEX     = /^[a-f\d]{24}$/i;
const ACADEMIC_YEAR_REGEX = /^\d{4}-\d{4}$/;

const objectId = (label = 'ID') =>
  Yup.string()
    .matches(OBJECT_ID_REGEX, `${label} must be a valid identifier`)
    .required(`${label} is required`);

// ─── SUB-SCHEMAS ──────────────────────────────────────────────────────────────

export const unavailableSlotSchema = Yup.object({
  day: Yup.string()
    .oneOf(['MO', 'TU', 'WE', 'TH', 'FR', 'SA', 'SU'], 'Invalid day')
    .required('Day is required'),
  startHour: Yup.number()
    .integer('Must be a whole hour')
    .min(0, 'Minimum 0h')
    .max(23, 'Maximum 23h')
    .required('Start hour is required'),
  endHour: Yup.number()
    .integer('Must be a whole hour')
    .min(1, 'Minimum 1h')
    .max(24, 'Maximum 24h')
    .required('End hour is required')
    .test(
      'after-start',
      'End must be after start',
      function (v) { return !v || v > this.parent.startHour; }
    ),
});

export const timeSlotSchema = Yup.object({
  day: Yup.string()
    .oneOf(['MO', 'TU', 'WE', 'TH', 'FR', 'SA', 'SU'], 'Invalid day')
    .required('Day is required'),
  startHour: Yup.number()
    .integer('Must be a whole hour')
    .min(0, 'Minimum 0h')
    .max(23, 'Maximum 23h')
    .required('Start hour is required'),
  endHour: Yup.number()
    .integer('Must be a whole hour')
    .min(1, 'Minimum 1h')
    .max(24, 'Maximum 24h')
    .required('End hour is required')
    .test(
      'after-start',
      'End must be after start',
      function (v) { return !v || v > this.parent.startHour; }
    ),
  isBreak: Yup.boolean().default(false),
});

export const courseRequirementSchema = Yup.object({
  classId:         objectId('Class'),
  subjectId:       objectId('Subject'),
  teacherId:       objectId('Teacher'),
  sessionType:     Yup.string()
    .oneOf(['LECTURE', 'TUTORIAL', 'PRACTICAL'], 'Invalid session type')
    .default('LECTURE'),
  hoursPerWeek:    Yup.number()
    .min(1, 'Minimum 1 h/week')
    .required('Hours per week is required'),
  sessionDuration: Yup.number()
    .min(30, 'Minimum 30 min')
    .default(90),
  studentCount:    Yup.number()
    .min(1, 'Minimum 1 student')
    .required('Student count is required'),
  requiresLab:     Yup.boolean().default(false),
  roomType:        Yup.string()
    .oneOf(['CLASSROOM', 'LAB', 'AMPHITHEATER'])
    .default('CLASSROOM'),
  preferMorning:   Yup.boolean().default(false),
});

export const roomRegistrySchema = Yup.object({
  name:     Yup.string().trim().max(60, 'Max 60 chars').required('Room name is required'),
  capacity: Yup.number()
    .min(1, 'Minimum capacity 1')
    .required('Capacity is required'),
  type:     Yup.string()
    .oneOf(['CLASSROOM', 'LAB', 'AMPHITHEATER'])
    .default('CLASSROOM'),
  unavailableSlots: Yup.array().of(unavailableSlotSchema).default([]),
});

// ─── MAIN SCHEMA ─────────────────────────────────────────────────────────────

export const gaetConstraintSchema = Yup.object({
  academicYear: Yup.string()
    .matches(ACADEMIC_YEAR_REGEX, 'Format: YYYY-YYYY (e.g. 2024-2025)')
    .test('consecutive', 'Must span exactly one year', (v) => {
      if (!v) return true;
      const [s, e] = v.split('-').map(Number);
      return e === s + 1;
    })
    .required('Academic year is required'),
  semester: Yup.string()
    .oneOf(['S1', 'S2', 'Annual'], 'Invalid semester')
    .required('Semester is required'),
  timeSlots: Yup.array()
    .of(timeSlotSchema)
    .min(1, 'Add at least one time slot'),
  courseRequirements: Yup.array()
    .of(courseRequirementSchema)
    .min(1, 'Add at least one course requirement'),
  roomRegistry: Yup.array()
    .of(roomRegistrySchema)
    .min(1, 'Add at least one room'),
});

// ─── DEFAULT VALUES ───────────────────────────────────────────────────────────

export const defaultTimeSlot = () => ({
  day: 'MO', startHour: 8, endHour: 10, isBreak: false,
});

export const defaultCourseRequirement = () => ({
  classId: '', subjectId: '', teacherId: '',
  sessionType: 'LECTURE', hoursPerWeek: 2, sessionDuration: 90,
  studentCount: 30, requiresLab: false, roomType: 'CLASSROOM', preferMorning: false,
});

export const defaultRoom = () => ({
  name: '', capacity: 30, type: 'CLASSROOM',
});

export default gaetConstraintSchema;
