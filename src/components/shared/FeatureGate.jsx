/**
 * @file FeatureGate.jsx
 * @description Renders a section, a panel or a button only when the campus's
 * entitlement allows it (design doc §8.2).
 *
 *   <FeatureGate feature="finance">            → hidden when the module is hidden
 *   <FeatureGate feature="finance" mode="write"> → also hidden when it is frozen
 *
 * `mode="write"` is what makes `read_only` usable: the list, the history and
 * the detail views stay exactly as they were, and only the mutating affordances
 * (a "New expense" button, a delete action, an edit form) disappear. A module
 * frozen for a quarter must never look like a module that lost its data.
 *
 * Nothing renders until the states are known — see §8.2 of the provider header:
 * showing a button and taking it away half a second later is the dead-button
 * experience the design forbids, and it is the one failure a user notices.
 */

import { useFeature } from '../../hooks/useFeature';

/**
 * @param {Object} props
 * @param {string} props.feature      - Registry key. Falsy renders children.
 * @param {'read'|'write'} [props.mode='read'] - `write` also requires ENABLED.
 * @param {React.ReactNode} [props.fallback=null] - Rendered INSTEAD when refused.
 *   Leave it null for the default answer: a refused module must be
 *   indiscernible from a module that does not exist (§4.1.2).
 * @param {React.ReactNode} props.children
 */
const FeatureGate = ({ feature, mode = 'read', fallback = null, children }) => {
  const { ready, visible, canWrite } = useFeature(feature);

  if (!feature) return children;
  if (!ready) return null;

  const allowed = mode === 'write' ? visible && canWrite : visible;
  return allowed ? children : fallback;
};

export default FeatureGate;
