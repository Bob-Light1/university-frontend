/**
 * @file timezones.js
 * @description Display-side helpers for IANA timezones. The authoritative
 * whitelist is owned by the backend (GET /api/settings/options) — never
 * hard-coded here. This module only handles grouping/ordering for the UI.
 */

// Region display order; any region not listed sorts alphabetically afterwards.
export const REGION_ORDER = ['UTC', 'Africa', 'America', 'Asia', 'Atlantic', 'Europe', 'Indian', 'Pacific'];

/**
 * Groups a flat IANA timezone list by region prefix (the part before '/'),
 * ordered by REGION_ORDER then alphabetically for any unknown region. Zones
 * inside each group are sorted alphabetically.
 *
 * @param {string[]} [zones]
 * @returns {{ label: string, zones: string[] }[]}
 */
export function groupTimezones(zones = []) {
  const byRegion = new Map();
  for (const tz of zones) {
    const region = tz === 'UTC' ? 'UTC' : tz.split('/')[0];
    if (!byRegion.has(region)) byRegion.set(region, []);
    byRegion.get(region).push(tz);
  }
  return [...byRegion.keys()]
    .sort((a, b) => {
      const ia = REGION_ORDER.indexOf(a);
      const ib = REGION_ORDER.indexOf(b);
      if (ia !== -1 && ib !== -1) return ia - ib;
      if (ia !== -1) return -1;
      if (ib !== -1) return 1;
      return a.localeCompare(b);
    })
    .map((label) => ({ label, zones: byRegion.get(label).sort() }));
}

/** Human-readable timezone label — "Africa/Douala" → "Africa / Douala". */
export const prettyTimezone = (tz) => tz.replace(/\//g, ' / ').replace(/_/g, ' ');
