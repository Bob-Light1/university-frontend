/**
 * @file TestimonialsAdmin.jsx
 * @description Admin page for managing portal testimonials (Phase 2).
 */

import FormatQuoteIcon from '@mui/icons-material/FormatQuote';
import ContentAdmin from '../../../components/portalAdmin/ContentAdmin';
import { testimonialsApi } from '../../../services/portalContentService';

const config = {
  title: 'Testimonial',
  pluralTitle: 'Testimonials',
  icon: FormatQuoteIcon,
  service: testimonialsApi,
  fields: [
    { name: 'firstName', label: 'First name', type: 'text', required: true },
    { name: 'city', label: 'City', type: 'text' },
    { name: 'graduationYear', label: 'Graduation year', type: 'number' },
    { name: 'program', label: 'Program', type: 'text' },
    { name: 'quote', label: 'Quote', type: 'bilingual', required: true, multiline: true },
    { name: 'photoUrl', label: 'Photo URL', type: 'text', placeholder: 'https://…' },
    { name: 'employer', label: 'Employer', type: 'text' },
    { name: 'order', label: 'Display order', type: 'number', default: 0 },
    { name: 'isPublished', label: 'Published', type: 'switch', default: false },
  ],
  renderPrimary: (t) => [t.firstName, t.city].filter(Boolean).join(' · '),
  renderSecondary: (t) => t.quote?.fr,
};

export default function TestimonialsAdmin() {
  return <ContentAdmin config={config} />;
}
