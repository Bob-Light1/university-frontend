/**
 * @file Attendance.jsx
 * @description Attendance entry point — renders the correct view based on user role.
 *
 * Role mapping:
 *  CAMPUS_MANAGER / ADMIN / DIRECTOR → AttendanceManager
 *  TEACHER                           → AttendanceTeacher
 *  STUDENT                           → AttendanceStudent
 *
 * This component is lazy-loaded in CampusRoutes.jsx:
 *   const Attendance = lazy(() => import('../campus/components/attendance/Attendance'));
 *   <Route path="attendance" element={<Attendance />} />
 *
 * Teacher and Student routes should similarly import their respective views.
 */

import { useContext } from 'react';
import { Box, Alert } from '@mui/material';
import { AuthContext } from '../../../context/AuthContext';

import AttendanceManager from './AttendanceManager';
import AttendanceTeacher from '../../../teacher/components/attendance/AttendanceTeacher';
import AttendanceStudent from '../../../student/components/attendance/AttendanceStudent';

// Role → component map
const ROLE_COMPONENTS = {
  CAMPUS_MANAGER: AttendanceManager,
  ADMIN:          AttendanceManager,
  DIRECTOR:       AttendanceManager,
  TEACHER:        AttendanceTeacher,
  STUDENT:        AttendanceStudent,
};

const Attendance = () => {
  const { user, getUserRole } = useContext(AuthContext);
  const role = getUserRole();

  const Component = ROLE_COMPONENTS[role];

  if (!Component) {
    return (
      <Box p={3}>
        <Alert severity="error">
          Access denied. Your role ({role || 'unknown'}) does not have access to attendance management.
        </Alert>
      </Box>
    );
  }

  return <Component />;
};

export default Attendance;