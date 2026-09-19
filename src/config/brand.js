/**
 * @file brand.js
 * @description Public deployment identity and validated outbound destinations.
 */
const env = import.meta.env;

/** Accept HTTPS destinations, plus loopback HTTP for local development. */
export function publicUrl(value, allowRelative = false) {
  const input = String(value || '').trim();
  if (allowRelative && /^\/(?!\/)/.test(input)) return input;
  try {
    const url = new URL(input);
    const local = ['localhost', '127.0.0.1', '[::1]'].includes(url.hostname);
    return !url.username && !url.password && (url.protocol === 'https:' || (local && url.protocol === 'http:')) ? url.href : '';
  } catch { return ''; }
}

/** Resolve configuration without exposing secrets or using database state. */
export function resolveBrand(config = {}) {
  const email = String(config.VITE_SALES_EMAIL || '').trim();
  const salesUrl = publicUrl(config.VITE_SALES_URL);
  const salesEmail = /^[^\s@<>?&#]+@[^\s@<>?&#]+\.[^\s@<>?&#]+$/.test(email) ? email : '';
  return Object.freeze({
    name: String(config.VITE_BRAND_NAME || '').trim() || 'Wewigo',
    logo: publicUrl(config.VITE_BRAND_LOGO_URL, true),
    icon: publicUrl(config.VITE_BRAND_ICON_URL, true) || '/brand-icon.svg',
    salesHref: salesUrl || (salesEmail ? `mailto:${salesEmail}` : ''),
    privacy: publicUrl(config.VITE_PRIVACY_URL),
    terms: publicUrl(config.VITE_TERMS_URL),
  });
}

export const BRAND = resolveBrand(env);
