import GenericEntityPage   from '../../../components/shared/GenericEntityPage';
import MentorForm          from './MentorForm';
import MentorDetailDrawer  from './MentorDetailDrawer';
import { mentorConfig }    from './MentorConfig';

export default function CampusMentors() {
  return (
    <GenericEntityPage
      entityName={mentorConfig.entityName}
      entityNamePlural={mentorConfig.entityNamePlural}
      apiEndpoint={mentorConfig.apiEndpoint}

      tableColumns={mentorConfig.tableColumns}
      renderTableRow={mentorConfig.renderTableRow}

      filterConfig={mentorConfig.getFilterConfig}
      searchPlaceholder={mentorConfig.searchPlaceholder}

      getKPIMetrics={mentorConfig.getKPIMetrics}

      bulkActions={mentorConfig.bulkActions}

      addButtonText={mentorConfig.addButtonText}
      addButtonIcon={mentorConfig.addButtonIcon}

      relatedDataEndpoints={mentorConfig.relatedDataEndpoints}

      FormComponent={MentorForm}
      DetailComponent={MentorDetailDrawer}

      showArchiveToggle={true}
      enableExport={true}
    />
  );
}
