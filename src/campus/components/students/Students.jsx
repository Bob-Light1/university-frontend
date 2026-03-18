import React from 'react';
import GenericEntityPage    from '../../../components/shared/GenericEntityPage';
import StudentForm          from './StudentForm';
import StudentDetailDrawer  from './StudentDetailDrawer';
import { studentConfig }    from './studentConfig';

/**
 * STUDENTS PAGE
 *
 * Thin orchestrator: wires student-specific configuration into GenericEntityPage.
 * All logic (CRUD, bulk, filters, KPIs, pagination) lives in GenericEntityPage.
 */
const Students = () => (
  <GenericEntityPage
    // ── Entity identity ──────────────────────────────────────────────────────
    entityName={studentConfig.entityName}
    entityNamePlural={studentConfig.entityNamePlural}
    apiEndpoint={studentConfig.apiEndpoint}

    // ── Table ─────────────────────────────────────────────────────────────────
    tableColumns={studentConfig.tableColumns}
    renderTableRow={studentConfig.renderTableRow}

    // ── Filters & search ──────────────────────────────────────────────────────
    filterConfig={studentConfig.getFilterConfig}
    searchPlaceholder={studentConfig.searchPlaceholder}

    // ── KPIs ──────────────────────────────────────────────────────────────────
    getKPIMetrics={studentConfig.getKPIMetrics}

    // ── Bulk actions ──────────────────────────────────────────────────────────
    bulkActions={studentConfig.bulkActions}

    // ── Add button ────────────────────────────────────────────────────────────
    addButtonText={studentConfig.addButtonText}
    addButtonIcon={studentConfig.addButtonIcon}

    /**
     * Related data required by filterConfig (classes dropdown) and the
     * BulkClassModal (changeClass action).
     * Declared explicitly so the campus-scoped URL is used instead of the
     * generic '/class' fallback that GenericEntityPage would otherwise inject.
     */
    relatedDataEndpoints={studentConfig.relatedDataEndpoints}

    // ── UI components ─────────────────────────────────────────────────────────
    FormComponent={StudentForm}
    DetailComponent={StudentDetailDrawer}

    // ── Feature flags ─────────────────────────────────────────────────────────
    showArchiveToggle={true}
    enableImport={true}
    enableExport={true}
  />
);

export default Students;