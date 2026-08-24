import React, { useState } from 'react';
import { Button } from '@mui/material';
import { Business as BusinessIcon } from '@mui/icons-material';
import GenericEntityPage from '../../../components/shared/GenericEntityPage';
import TeacherForm from './TeacherForm';
import TeacherDetailDrawer from './TeacherDetailDrawer';
import ManageDepartment from '../department/ManageDepartment';
import { teacherConfig } from './TeacherConfig';
import FeatureGate from '../../../components/shared/FeatureGate';

/**
 * TEACHERS PAGE
 *
 * Uses GenericEntityPage with teacher-specific configuration.
 * Adds a "Manage Departments" shortcut that opens ManageDepartment
 * modal inline — same pattern as "Manage Levels" in Classes.jsx.
 */
const Teachers = () => {
  const [deptModalOpen, setDeptModalOpen] = useState(false);

  // `department` is a registry module with no route and no menu entry of its
  // own — this shortcut is its only entry point, and it sits inside `teacher`,
  // which is core and never hides. Ungated, a hidden `department` left a live
  // button whose every call answered 403 (design doc §4.1.2).
  const extraHeaderActions = (
    <FeatureGate feature="department">
    <Button
      variant="outlined"
      startIcon={<BusinessIcon />}
      onClick={() => setDeptModalOpen(true)}
      sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 600, whiteSpace: 'nowrap' }}
    >
      Manage Departments
    </Button>
    </FeatureGate>
  );

  return (
    <>
      <GenericEntityPage
        entityName={teacherConfig.entityName}
        entityNamePlural={teacherConfig.entityNamePlural}
        apiEndpoint={teacherConfig.apiEndpoint}
        dangerZoneEntityType={teacherConfig.dangerZoneEntityType}

        tableColumns={teacherConfig.tableColumns}
        renderTableRow={teacherConfig.renderTableRow}

        filterConfig={teacherConfig.getFilterConfig}
        searchPlaceholder={teacherConfig.searchPlaceholder}

        getKPIMetrics={teacherConfig.getKPIMetrics}

        bulkActions={teacherConfig.bulkActions}

        addButtonText={teacherConfig.addButtonText}
        addButtonIcon={teacherConfig.addButtonIcon}

        relatedDataEndpoints={teacherConfig.relatedDataEndpoints}

        FormComponent={TeacherForm}
        DetailComponent={TeacherDetailDrawer}

        showArchiveToggle={true}
        enableImport={true}
        enableExport={true}

        extraHeaderActions={extraHeaderActions}
      />

      <ManageDepartment
        open={deptModalOpen}
        onClose={() => setDeptModalOpen(false)}
        onDepartmentsUpdated={() => {
          // TeacherForm reloads departments independently on open,
          // so no forced refresh needed here.
        }}
      />
    </>
  );
};

export default Teachers;