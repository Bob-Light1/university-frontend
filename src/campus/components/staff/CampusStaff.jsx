import { PersonAdd } from '@mui/icons-material';

import GenericEntityPage from '../../../components/shared/GenericEntityPage';
import StaffForm         from './StaffForm';
import StaffDetailDrawer from './StaffDetailDrawer';
import {
  staffConfig, getKPIMetrics, getTableColumns, getFilterConfig, renderTableRow,
} from './StaffConfig';
import { useAppTranslation } from '../../../hooks/useAppTranslation';

export default function CampusStaff() {
  const { t } = useAppTranslation(['staff', 'common']);

  return (
    <GenericEntityPage
      entityName={t('staff:list.entityName')}
      entityNamePlural={t('staff:list.entityNamePlural')}
      apiEndpoint={staffConfig.apiEndpoint}

      tableColumns={getTableColumns(t)}
      renderTableRow={(staff, helpers) => renderTableRow(staff, helpers, t)}

      filterConfig={() => getFilterConfig(t)}
      searchPlaceholder={t('staff:list.searchPlaceholder')}

      getKPIMetrics={(kpis, theme) => getKPIMetrics(kpis, theme, t)}

      bulkActions={staffConfig.bulkActions}

      addButtonText={t('staff:list.addButton')}
      addButtonIcon={<PersonAdd />}

      relatedDataEndpoints={staffConfig.relatedDataEndpoints}

      FormComponent={StaffForm}
      DetailComponent={StaffDetailDrawer}

      showArchiveToggle={true}
      enableExport={true}
    />
  );
}
