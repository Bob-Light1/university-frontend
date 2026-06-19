import * as yup from 'yup';
import { VALID_TYPES, VALID_ROLES } from '../components/announcements/announcementConstants';

// Date inputs are calendar days. Yup casts "YYYY-MM-DD" to UTC midnight, so a
// naive `val > new Date()` wrongly rejects *today*. Compare calendar days
// instead: a deadline is valid if its day is today or later (it is enforced at
// end-of-day — see AnnouncementFormDialog).
const isFutureDate = (val) => {
  if (!val) return true;
  const now = new Date();
  const todayUTC  = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate());
  const pickedUTC = Date.UTC(val.getUTCFullYear(), val.getUTCMonth(), val.getUTCDate());
  return pickedUTC >= todayUTC;
};

export const announcementSchema = yup.object({
  title: yup
    .string()
    .trim()
    .min(3, 'Title must be at least 3 characters.')
    .max(150, 'Title must not exceed 150 characters.')
    .required('Title is required.'),

  content: yup
    .string()
    .trim()
    .min(10, 'Content must be at least 10 characters.')
    .max(3000, 'Content must not exceed 3 000 characters.')
    .required('Content is required.'),

  type: yup
    .string()
    .oneOf(VALID_TYPES, 'Invalid announcement type.')
    .default('info'),

  targetRoles: yup
    .array()
    .of(yup.string().oneOf(VALID_ROLES))
    .min(1, 'Select at least one target audience.')
    .default(['ALL']),

  pinned: yup.boolean().default(false),

  pinnedUntil: yup
    .date()
    .nullable()
    .optional()
    .when('pinned', {
      is: true,
      then: (s) =>
        s
          .test('future', 'Auto-unpin date must be today or later.', isFutureDate)
          .nullable(),
    }),

  expiresAt: yup
    .date()
    .nullable()
    .optional()
    .test('future', 'Expiry date must be today or later.', isFutureDate),
});
