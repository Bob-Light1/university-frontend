import GenericEntityPage from '../../../components/shared/GenericEntityPage';
import { parentConfig }  from './ParentConfig';
import ParentForm         from './ParentForm';
import ParentDetailDrawer from './ParentDetailDrawer';

/**
 * Parents management page — accessible by ADMIN, DIRECTOR, CAMPUS_MANAGER.
 * Mounted inside the campus layout at /campus/:campusId/parents.
 *
 * All orchestration (fetching, pagination, filters, CRUD dialogs, bulk actions,
 * KPI cards) is handled by GenericEntityPage; this component is intentionally thin.
 */
const Parents = () => (
  <GenericEntityPage
    entityName={parentConfig.entityName}
    entityNamePlural={parentConfig.entityNamePlural}
    apiEndpoint={parentConfig.apiEndpoint}
    tableColumns={parentConfig.tableColumns}
    renderTableRow={parentConfig.renderTableRow}
    filterConfig={parentConfig.getFilterConfig}
    searchPlaceholder={parentConfig.searchPlaceholder}
    getKPIMetrics={parentConfig.getKPIMetrics}
    bulkActions={parentConfig.bulkActions}
    FormComponent={ParentForm}
    DetailComponent={ParentDetailDrawer}
    showArchiveToggle={true}
    enableImport={false}
    enableExport={true}
    kpiEndpoint="/parents/stats/campus/:campusId"
  />
);

export default Parents;
