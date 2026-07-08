/**
 * @file CoursesAdmin.jsx
 * @description Admin page for managing portal course previews (Phase 2).
 */

import MenuBookIcon from '@mui/icons-material/MenuBook';
import ContentAdmin from '../../../components/portalAdmin/ContentAdmin';
import { coursePreviewsApi } from '../../../services/portalContentService';

const config = {
  i18nKey: 'course',
  icon: MenuBookIcon,
  service: coursePreviewsApi,
  fields: [
    { name: 'program', labelKey: 'field.program', type: 'text', required: true },
    { name: 'title', labelKey: 'field.title', type: 'bilingual', required: true },
    { name: 'content', labelKey: 'field.content', type: 'bilingual', required: true, multiline: true },
    { name: 'videoUrl', labelKey: 'field.videoUrl', type: 'text', placeholder: 'https://…' },
    { name: 'order', labelKey: 'field.order', type: 'number', default: 0 },
    { name: 'isPublished', labelKey: 'field.isPublished', type: 'switch', default: false },
  ],
  renderPrimary: (c) => c.title?.fr,
  renderSecondary: (c) => c.program,
};

export default function CoursesAdmin() {
  return <ContentAdmin config={config} />;
}
