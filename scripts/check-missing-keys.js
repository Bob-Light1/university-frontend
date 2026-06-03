#!/usr/bin/env node
/**
 * CI gate: cross-validate all locale folders.
 * Fails with exit code 1 if any locale is missing a key present in en/ (reference).
 * Also warns about orphaned keys (in non-en locales but not in en/).
 *
 * Usage:  node scripts/check-missing-keys.js
 */

import { readFileSync, readdirSync, statSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const LOCALES_DIR = join(__dirname, '..', 'public', 'locales');
const REFERENCE   = 'en';
const LANGUAGES   = readdirSync(LOCALES_DIR).filter(d =>
  statSync(join(LOCALES_DIR, d)).isDirectory()
);
const NAMESPACES  = readdirSync(join(LOCALES_DIR, REFERENCE))
  .filter(f => f.endsWith('.json'))
  .map(f => f.replace('.json', ''));

function flatKeys(obj, prefix = '') {
  return Object.entries(obj).flatMap(([k, v]) => {
    const full = prefix ? `${prefix}.${k}` : k;
    return typeof v === 'object' && v !== null && !Array.isArray(v)
      ? flatKeys(v, full)
      : [full];
  });
}

let errors   = 0;
let warnings = 0;

for (const ns of NAMESPACES) {
  const refPath = join(LOCALES_DIR, REFERENCE, `${ns}.json`);
  if (!existsSync(refPath)) continue;
  const refData = JSON.parse(readFileSync(refPath, 'utf8'));
  const refKeys = new Set(flatKeys(refData));

  for (const lang of LANGUAGES) {
    if (lang === REFERENCE) continue;

    const filePath = join(LOCALES_DIR, lang, `${ns}.json`);
    if (!existsSync(filePath)) {
      console.error(`❌ MISSING FILE: ${lang}/${ns}.json`);
      errors++;
      continue;
    }

    const data   = JSON.parse(readFileSync(filePath, 'utf8'));
    const keys   = new Set(flatKeys(data));

    // Missing keys (in ref but not in lang)
    for (const k of refKeys) {
      if (!keys.has(k)) {
        console.error(`❌ MISSING [${lang}/${ns}]: ${k}`);
        errors++;
      }
    }

    // Orphaned keys (in lang but not in ref)
    for (const k of keys) {
      if (!refKeys.has(k)) {
        console.warn(`⚠️  ORPHAN [${lang}/${ns}]: ${k}`);
        warnings++;
      }
    }
  }
}

const total = LANGUAGES.length * NAMESPACES.length;
console.log(`\n✅ Checked ${total} locale/namespace combos`);
if (warnings) console.warn(`⚠️  ${warnings} orphaned keys (non-blocking)`);
if (errors) {
  console.error(`\n❌ ${errors} missing keys — CI FAILED`);
  process.exit(1);
} else {
  console.log('✅ All locales complete — CI PASSED');
}
