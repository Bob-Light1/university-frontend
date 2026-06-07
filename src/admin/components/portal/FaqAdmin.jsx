/**
 * @file FaqAdmin.jsx
 * @description Admin page for managing portal FAQ entries (Phase 2).
 */

import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import ContentAdmin from '../../../components/portalAdmin/ContentAdmin';
import { faqApi } from '../../../services/portalContentService';

const config = {
  title: 'FAQ entry',
  pluralTitle: 'FAQ',
  icon: HelpOutlineIcon,
  service: faqApi,
  fields: [
    { name: 'question', label: 'Question', type: 'bilingual', required: true },
    { name: 'answer', label: 'Answer', type: 'bilingual', required: true, multiline: true },
    {
      name: 'category', label: 'Category', type: 'select', default: 'general',
      options: [
        { value: 'general', label: 'General' },
        { value: 'inscription', label: 'Registration' },
        { value: 'tarifs', label: 'Pricing' },
        { value: 'formations', label: 'Programs' },
      ],
    },
    { name: 'order', label: 'Display order', type: 'number', default: 0 },
    { name: 'isPublished', label: 'Published', type: 'switch', default: false },
  ],
  renderPrimary: (e) => e.question?.fr,
  renderSecondary: (e) => e.answer?.fr,
};

export default function FaqAdmin() {
  return <ContentAdmin config={config} />;
}
