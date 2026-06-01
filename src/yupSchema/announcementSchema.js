import * as yup from 'yup';
import { VALID_TYPES, VALID_ROLES } from '../components/announcements/announcementConstants';

// Evaluated at validation time, not at module load.
const isFutureDate = (val) => !val || val > new Date();

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
          .test('future', 'Auto-unpin date must be in the future.', isFutureDate)
          .nullable(),
    }),

  expiresAt: yup
    .date()
    .nullable()
    .optional()
    .test('future', 'Expiry date must be in the future.', isFutureDate),
});
