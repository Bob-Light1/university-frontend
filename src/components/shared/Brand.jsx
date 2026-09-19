/**
 * @file Brand.jsx
 * @description Deployment identity shared by public and authenticated surfaces.
 */
import { useState } from 'react';
import { BRAND } from '../../config/brand';

/** Render a readable wordmark even when a custom image cannot be loaded. */
export default function Brand({ compact = false }) {
  const [failed, setFailed] = useState(false);
  return <span style={{ display: 'inline-flex', alignItems: 'center', gap: 10, minWidth: 0, color: 'inherit', fontWeight: 750, letterSpacing: '-0.035em' }}>
    {BRAND.logo && !failed
      ? <img src={BRAND.logo} alt="" width="34" height="34" onError={() => setFailed(true)} style={{ objectFit: 'contain', flexShrink: 0 }} />
      : <svg width="34" height="34" viewBox="0 0 34 34" fill="none" aria-hidden="true" style={{ flexShrink: 0 }}><rect width="34" height="34" rx="10" fill="#153b56"/><path d="M8 10h5l4 3 4-3h5v14h-5l-4 2-4-2H8Z" stroke="white" strokeWidth="2.2" strokeLinejoin="round"/><circle cx="26" cy="8" r="3" fill="#ec8746"/></svg>}
    <span style={compact ? { position: 'absolute', width: 1, height: 1, overflow: 'hidden', clipPath: 'inset(50%)' } : { overflowWrap: 'anywhere' }}>{BRAND.name}</span>
  </span>;
}
