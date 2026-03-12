/**
 * @file Document.jsx
 * @description Document module entry point for the campus layout.
 *
 * Renders DocumentManager for campus managers, admins, and directors.
 * This component is rendered inside the Campus shell (campus/:campusId/documents).
 * Role guard is already enforced by ProtectedRoute at the route level.
 */

import DocumentManager from '../../../campus/components/documents/DocumentManager';

const Document = () => <DocumentManager />;

export default Document;