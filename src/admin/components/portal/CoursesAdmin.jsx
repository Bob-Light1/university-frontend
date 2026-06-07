/**
 * @file CoursesAdmin.jsx
 * @description Admin page for managing portal course previews (Phase 2).
 */

import MenuBookIcon from '@mui/icons-material/MenuBook';
import ContentAdmin from '../../../components/portalAdmin/ContentAdmin';
import { coursePreviewsApi } from '../../../services/portalContentService';

const config = {
  title: 'Course preview',
  pluralTitle: 'Course previews',
  icon: MenuBookIcon,
  service: coursePreviewsApi,
  fields: [
    { name: 'program', label: 'Program', type: 'text', required: true },
    { name: 'title', label: 'Title', type: 'bilingual', required: true },
    { name: 'content', label: 'Content (excerpt)', type: 'bilingual', required: true, multiline: true },
    { name: 'videoUrl', label: 'Video URL', type: 'text', placeholder: 'https://…' },
    { name: 'order', label: 'Display order', type: 'number', default: 0 },
    { name: 'isPublished', label: 'Published', type: 'switch', default: false },
  ],
  renderPrimary: (c) => c.title?.fr,
  renderSecondary: (c) => c.program,
};

export default function CoursesAdmin() {
  return <ContentAdmin config={config} />;
}
