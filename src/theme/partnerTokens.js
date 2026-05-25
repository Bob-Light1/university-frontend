// ─── Brand colours ────────────────────────────────────────────────────────────

export const BRAND_ORANGE        = '#ff7f3e';
export const BRAND_ORANGE_LIGHT  = '#ff9f5a';
export const BRAND_GRADIENT      = 'linear-gradient(135deg, #d4530a 0%, #ff7f3e 100%)';
export const BRAND_GRADIENT_BTN  = 'linear-gradient(135deg, #ff7f3e 0%, #ff9f5a 100%)';
export const BRAND_SHADOW        = '0 4px 12px rgba(255,127,62,0.3)';

// ─── Third-party brand colours ─────────────────────────────────────────────────

export const WHATSAPP_GREEN       = '#25d366';
export const WHATSAPP_GREEN_HOVER = '#1ebe5e';
export const WHATSAPP_BG          = '#f0fdf4';
export const WHATSAPP_BORDER      = '#bbf7d0';

export const SMS_BG     = '#eff6ff';
export const SMS_BORDER = '#bfdbfe';

// ─── Tier ─────────────────────────────────────────────────────────────────────

export const TIER_COLOR = {
  bronze:   '#cd7f32',
  silver:   '#9e9e9e',
  gold:     '#f9a825',
  platinum: '#78909c',
};

export const TIER_LABEL = {
  bronze: 'Bronze', silver: 'Silver', gold: 'Gold', platinum: 'Platinum',
};

// ─── Lead status ──────────────────────────────────────────────────────────────

export const LEAD_STATUS_COLOR = {
  new:               'default',
  contacted:         'info',
  dossier_submitted: 'warning',
  admitted:          'secondary',
  enrolled:          'success',
  rejected:          'error',
  abandoned:         'default',
};

export const LEAD_STATUS_LABEL = {
  new:               'New',
  contacted:         'Contacted',
  dossier_submitted: 'Dossier',
  admitted:          'Admitted',
  enrolled:          'Enrolled',
  rejected:          'Rejected',
  abandoned:         'Abandoned',
};

export const LEAD_SOURCE_LABEL = {
  qr_code:       'QR Code',
  referral_link: 'Link',
  manual_code:   'Manual',
  direct:        'Direct',
};

// ─── Commission status ────────────────────────────────────────────────────────

export const COMMISSION_STATUS_COLOR = {
  pending:   'warning',
  validated: 'info',
  paid:      'success',
  disputed:  'error',
  cancelled: 'default',
};

export const COMMISSION_STATUS_LABEL = {
  pending:   'Pending',
  validated: 'Validated',
  paid:      'Paid',
  disputed:  'Disputed',
  cancelled: 'Cancelled',
};

// ─── Partner status ───────────────────────────────────────────────────────────

export const partnerStatusColor = (status) =>
  status === 'active' ? 'success' : status === 'suspended' ? 'error' : 'default';
