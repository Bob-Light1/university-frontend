/**
 * @file theme-mode-qa.mjs
 * @description Exercise the real theme store with browser storage events and failures.
 */
import assert from 'node:assert/strict';

const values = new Map();
let unavailable = false;
let writes = 0;
const storage = {
  getItem(key) { if (unavailable) throw new Error('Storage unavailable'); return values.get(key) ?? null; },
  setItem(key, value) { if (unavailable) throw new Error('Storage unavailable'); writes++; values.set(key, value); },
};
const events = new EventTarget();
Object.defineProperty(globalThis, 'localStorage', { configurable: true, value: storage });
globalThis.window = events;
window.localStorage = storage;
window.matchMedia = () => ({ matches: true });
const { getThemeMode, setThemeMode, subscribeThemeMode, resolveMode, THEME_STORAGE_KEY } = await import('../src/theme/themeMode.js');

/** Simulate another document's storage mutation; it must never trigger a write loop. */
function storageEvent(key, value, storageArea = storage) {
  if (key === null) values.clear();
  else if (value === null) values.delete(key);
  else values.set(key, value);
  const event = new Event('storage');
  Object.assign(event, { key, newValue: value, storageArea });
  events.dispatchEvent(event);
}

assert.equal(getThemeMode(), 'light');
const seen = [];
let stop = subscribeThemeMode(mode => seen.push(mode));
setThemeMode('dark');
assert.equal(getThemeMode(), 'dark');
assert.equal(values.get(THEME_STORAGE_KEY), 'dark');
const beforeWrites = writes;
storageEvent(THEME_STORAGE_KEY, 'light');
assert.equal(getThemeMode(), 'light');
assert.equal(seen.at(-1), 'light');
assert.equal(writes, beforeWrites, 'Peer changes must not rewrite storage');
storageEvent(THEME_STORAGE_KEY, 'system');
assert.equal(getThemeMode(), 'system');
assert.equal(resolveMode(), 'dark');
storageEvent('unrelated', 'dark');
assert.equal(getThemeMode(), 'system');
storageEvent(THEME_STORAGE_KEY, 'dark', {});
assert.equal(getThemeMode(), 'system', 'Session-storage events must be ignored');
storageEvent(THEME_STORAGE_KEY, 'invalid');
assert.equal(getThemeMode(), 'light');
setThemeMode('dark');
storageEvent(THEME_STORAGE_KEY, null);
assert.equal(getThemeMode(), 'light');
setThemeMode('dark');
storageEvent(null, null);
assert.equal(getThemeMode(), 'light');
const beforeNoop = seen.length;
setThemeMode('light');
assert.equal(seen.length, beforeNoop);
stop();
storageEvent(THEME_STORAGE_KEY, 'dark');
assert.equal(seen.length, beforeNoop, 'Unsubscribe removes the storage listener');
unavailable = true;
setThemeMode('dark');
stop = subscribeThemeMode(mode => seen.push(mode));
assert.equal(getThemeMode(), 'dark', 'A subscriber must retain an in-memory preference when storage is blocked');
assert.equal(seen.at(-1), 'dark');
setThemeMode('light');
assert.equal(seen.at(-1), 'light');
stop();
process.stdout.write('PASS: theme store persistence, peer events, cleanup and blocked storage\n');
