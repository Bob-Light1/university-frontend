/**
 * @file useModuleLabel.js
 * @description Turns a registry key (`'finance'`, `'gaet'`…) into a name a
 * human reads, in their own language.
 *
 * The backend registry is the single source of truth for WHICH modules exist
 * and it carries an English `label` for each (design doc §6.1). That label is
 * the fallback, never the display value: phase 4 translates the names into the
 * ten locales under `common.features.modules.*`, keyed by the registry key
 * itself, so adding a module still requires no frontend release — it simply
 * shows its English name until somebody translates it.
 *
 * One resolver for every surface that names a module — the "module not
 * activated" screen, the read-only banner, the pilot matrices, the estate view.
 * A component that formats its own would be a second naming of the same thing,
 * and the two would diverge in whichever locale nobody checks.
 */

import { useCallback } from 'react';

import { useAppTranslation } from './useAppTranslation';

/**
 * @returns {(key: string, fallback?: string|null) => string|null} resolver.
 *   Falls back to the registry label, then to the key itself — a raw key on
 *   screen is ugly, an empty label is unreadable.
 */
export const useModuleLabel = () => {
  const { t } = useAppTranslation('common');

  return useCallback(
    (key, fallback = null) => {
      if (!key) return fallback;
      // `defaultValue` keeps `useAppTranslation`'s missing-key reporter quiet:
      // an untranslated module is expected here, not a bug to chase.
      return t(`features.modules.${key}`, { defaultValue: fallback || key });
    },
    [t],
  );
};

export default useModuleLabel;
