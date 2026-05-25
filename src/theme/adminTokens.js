/**
 * @file adminTokens.js
 * @description Design tokens for the Admin / Director portal.
 *
 * Single source of truth for brand colors, gradients and status maps.
 * Used by: AdminDashboard, AdminAccounts, AdminProfile, CampusList, NewCampus.
 */

export const ADMIN_PRIMARY   = '#003285';
export const ADMIN_SECONDARY = '#2a629a';

export const ADMIN_GRADIENT     = 'linear-gradient(135deg, #003285 0%, #2a629a 100%)';
export const ADMIN_GRADIENT_BTN = ADMIN_GRADIENT;
export const ADMIN_SHADOW       = '0 6px 20px rgba(0, 50, 133, 0.35)';

// Campus / entity status → MUI Chip color name
export const CAMPUS_STATUS_COLOR = {
  active:   'success',
  inactive: 'default',
  archived: 'error',
};
