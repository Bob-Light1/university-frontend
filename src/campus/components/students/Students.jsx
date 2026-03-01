import React from 'react';
import GenericEntityPage from '../../../components/shared/GenericEntityPage';
import StudentForm from './StudentForm';
import StudentDetailDrawer from './StudentDetailDrawer';
import { studentConfig } from './studentConfig';


const Students = () => {
  return (
    <GenericEntityPage
      // basic configurations from config.jsx
      entityName={studentConfig.entityName}
      entityNamePlural={studentConfig.entityNamePlural}
      apiEndpoint={studentConfig.apiEndpoint}
      
      // Table configuration
      tableColumns={studentConfig.tableColumns}
      renderTableRow={studentConfig.renderTableRow}
      
      // Filters & Search
      filterConfig={studentConfig.getFilterConfig}
      searchPlaceholder={studentConfig.searchPlaceholder}
      
      // KPIs
      getKPIMetrics={studentConfig.getKPIMetrics}
      
      // Bulk actions disponibles
      bulkActions={studentConfig.bulkActions}
      
      // Bouton d'ajout personnalisé
      addButtonText={studentConfig.addButtonText}
      addButtonIcon={studentConfig.addButtonIcon}
      
      // Composants UI (REQUIS)
      FormComponent={StudentForm}              
      DetailComponent={StudentDetailDrawer}  

      //Show archived
      showArchiveToggle={true} 

      // Activate import
      enableImport={true}  
      
      // Activate export 
      enableExport={true}   
    />
  );
};

export default Students;