/** @file admissionConstants.js @description Backend admission vocabulary mirror, pinned by contract tests. */
export const LEAD_STATUS = Object.freeze({
  "NEW": "new",
  "CONTACTED": "contacted",
  "SUBMITTED": "dossier_submitted",
  "ADMITTED": "admitted",
  "ENROLLED": "enrolled",
  "REJECTED": "rejected",
  "ABANDONED": "abandoned"
});
export const TRANSITIONS = Object.freeze({
  "new": [
    "contacted",
    "dossier_submitted",
    "rejected",
    "abandoned"
  ],
  "contacted": [
    "dossier_submitted",
    "rejected",
    "abandoned"
  ],
  "dossier_submitted": [
    "admitted",
    "rejected",
    "abandoned"
  ],
  "admitted": [
    "enrolled",
    "rejected",
    "abandoned"
  ],
  "enrolled": [],
  "rejected": [],
  "abandoned": []
});
export const ATTACHMENT_CATEGORIES = Object.freeze([
  "identity",
  "diploma",
  "transcript",
  "other"
]);
export const ADMISSION_ROLES = Object.freeze([
  "ADMIN",
  "DIRECTOR"
]);
export const ADMISSION_ERRORS = Object.freeze({
  "INVALID": "ADMISSION_INVALID",
  "NOT_FOUND": "ADMISSION_NOT_FOUND",
  "FORBIDDEN": "ADMISSION_FORBIDDEN",
  "CONFLICT": "ADMISSION_CONFLICT",
  "INCOMPLETE": "ADMISSION_INCOMPLETE",
  "QUOTA": "ADMISSION_QUOTA",
  "DUPLICATE": "ADMISSION_DUPLICATE_STUDENT",
  "CAPABILITY": "ADMISSION_INVALID_ACCESS",
  "HISTORICAL": "ADMISSION_HISTORICAL_ENROLLMENT",
  "FILE": "ADMISSION_INVALID_FILE"
});
export const DRAFT_STATUSES = Object.freeze(["new","contacted"]);
