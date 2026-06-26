export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
export const IMAGE_BASE_URL = import.meta.env.VITE_IMAGE_BASE_URL;

/**
 * Public marketing portal base URL (Next.js portal). The single canonical
 * pre-registration funnel: the legacy ERP `/register` page now redirects here.
 * Must be set to the deployed portal origin in every non-local environment.
 */
export const PORTAL_URL = import.meta.env.VITE_PORTAL_URL || 'http://localhost:3000';
