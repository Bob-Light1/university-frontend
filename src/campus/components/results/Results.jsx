/**
 * @file Result.jsx
 * @description Result module entry point — renders the correct view based on user role.
 *
 * Role mapping:
 *  CAMPUS_MANAGER / ADMIN / DIRECTOR → ResultManager
 *  TEACHER                           → ResultTeacher
 *  STUDENT                           → ResultStudent
 *
 * Register in CampusRoutes.jsx / TeacherRoutes.jsx / StudentRoutes.jsx:
 *   const Result = lazy(() => import('../campus/components/results/Result'));
 *   <Route path="results" element={<Result />} />
 *
 * Campus isolation is enforced server-side. This component only dispatches
 * the correct view — it never bypasses backend access controls.
 */

import { useContext } from 'react';
import { Box, Alert } from '@mui/material';
import { AuthContext } from '../../../context/AuthContext';

import ResultManager from './ResultManager';
import ResultTeacher from '../../../teacher/components/results/ResultTeacher';
import ResultStudent from '../../../student/components/results/ResultStudent';

// Role → component mapping
const ROLE_COMPONENTS = {
  CAMPUS_MANAGER: ResultManager,
  ADMIN:          ResultManager,
  DIRECTOR:       ResultManager,
  TEACHER:        ResultTeacher,
  STUDENT:        ResultStudent,
};

const Result = () => {
  const { getUserRole } = useContext(AuthContext);
  const role = getUserRole();
  const Component = ROLE_COMPONENTS[role];

  if (!Component) {
    return (
      <Box p={3}>
        <Alert severity="error">
          Access denied. Your role ({role || 'unknown'}) does not have access to results.
        </Alert>
      </Box>
    );
  }

  return <Component />;
};

export default Result;