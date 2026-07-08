/**
 * @file TestimonialsAdmin.jsx
 * @description Admin page for managing portal testimonials (Phase 2).
 */

import FormatQuoteIcon from '@mui/icons-material/FormatQuote';
import ContentAdmin from '../../../components/portalAdmin/ContentAdmin';
import { testimonialsApi } from '../../../services/portalContentService';

const config = {
  i18nKey: 'testimonial',
  icon: FormatQuoteIcon,
  service: testimonialsApi,
  fields: [
    { name: 'firstName', labelKey: 'field.firstName', type: 'text', required: true },
    { name: 'city', labelKey: 'field.city', type: 'text' },
    { name: 'graduationYear', labelKey: 'field.graduationYear', type: 'number' },
    { name: 'program', labelKey: 'field.program', type: 'text' },
    { name: 'quote', labelKey: 'field.quote', type: 'bilingual', required: true, multiline: true },
    { name: 'photoUrl', labelKey: 'field.photoUrl', type: 'text', placeholder: 'https://…' },
    { name: 'employer', labelKey: 'field.employer', type: 'text' },
    { name: 'order', labelKey: 'field.order', type: 'number', default: 0 },
    { name: 'isPublished', labelKey: 'field.isPublished', type: 'switch', default: false },
  ],
  renderPrimary: (t) => [t.firstName, t.city].filter(Boolean).join(' · '),
  renderSecondary: (t) => t.quote?.fr,
};

export default function TestimonialsAdmin() {
  return <ContentAdmin config={config} />;
}
