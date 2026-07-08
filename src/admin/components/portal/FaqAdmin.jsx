/**
 * @file FaqAdmin.jsx
 * @description Admin page for managing portal FAQ entries (Phase 2).
 */

import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import ContentAdmin from '../../../components/portalAdmin/ContentAdmin';
import { faqApi } from '../../../services/portalContentService';

const config = {
  i18nKey: 'faq',
  icon: HelpOutlineIcon,
  service: faqApi,
  fields: [
    { name: 'question', labelKey: 'field.question', type: 'bilingual', required: true },
    { name: 'answer', labelKey: 'field.answer', type: 'bilingual', required: true, multiline: true },
    {
      name: 'category', labelKey: 'field.category', type: 'select', default: 'general',
      options: [
        { value: 'general', labelKey: 'faqCategory.general' },
        { value: 'inscription', labelKey: 'faqCategory.inscription' },
        { value: 'tarifs', labelKey: 'faqCategory.tarifs' },
        { value: 'formations', labelKey: 'faqCategory.formations' },
      ],
    },
    { name: 'order', labelKey: 'field.order', type: 'number', default: 0 },
    { name: 'isPublished', labelKey: 'field.isPublished', type: 'switch', default: false },
  ],
  renderPrimary: (e) => e.question?.fr,
  renderSecondary: (e) => e.answer?.fr,
};

export default function FaqAdmin() {
  return <ContentAdmin config={config} />;
}
