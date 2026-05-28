import GenericEntityPage from '../../../components/shared/GenericEntityPage';
import StaffForm         from './StaffForm';
import StaffDetailDrawer from './StaffDetailDrawer';
import { staffConfig }   from './StaffConfig';

export default function CampusStaff() {
  return (
    <GenericEntityPage
      entityName={staffConfig.entityName}
      entityNamePlural={staffConfig.entityNamePlural}
      apiEndpoint={staffConfig.apiEndpoint}

      tableColumns={staffConfig.tableColumns}
      renderTableRow={staffConfig.renderTableRow}

      filterConfig={staffConfig.getFilterConfig}
      searchPlaceholder={staffConfig.searchPlaceholder}

      getKPIMetrics={staffConfig.getKPIMetrics}

      bulkActions={staffConfig.bulkActions}

      addButtonText={staffConfig.addButtonText}
      addButtonIcon={staffConfig.addButtonIcon}

      relatedDataEndpoints={staffConfig.relatedDataEndpoints}

      FormComponent={StaffForm}
      DetailComponent={StaffDetailDrawer}

      showArchiveToggle={true}
      enableExport={true}
    />
  );
}
