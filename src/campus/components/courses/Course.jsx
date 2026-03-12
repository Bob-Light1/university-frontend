/**
 * @file Course.jsx
 * @description Course module entry point — dispatches the correct view per role.
 *
 * Role mapping:
 *  ADMIN / DIRECTOR / CAMPUS_MANAGER → CourseManager
 *  TEACHER                           → CourseTeacher
 *  STUDENT                           → CourseStudent
 *
 * Register in the appropriate route file:
 *   const Course = lazy(() => import('../campus/components/courses/Course'));
 *   <Route path="courses" element={<Course />} />
 *
 * Courses are GLOBAL entities — no campusId is required at this level.
 * Campus isolation for resource/subject actions is enforced server-side.
 */

import { useContext } from 'react';
import { Box, Alert } from '@mui/material';
import { AuthContext } from '../../../context/AuthContext';

import CourseManager from './CourseManager';
import CourseTeacher from '../../../teacher/components/courses/CourseTeacher';
import CourseStudent from '../../../student/components/courses/CourseStudent';

// Role → component mapping
const ROLE_COMPONENTS = {
  ADMIN:           CourseManager,
  DIRECTOR:        CourseManager,
  CAMPUS_MANAGER:  CourseManager,
  TEACHER:         CourseTeacher,
  STUDENT:         CourseStudent,
};

const Course = () => {
  const { getUserRole } = useContext(AuthContext);
  const role = getUserRole();
  const Component = ROLE_COMPONENTS[role];

  if (!Component) {
    return (
      <Box p={3}>
        <Alert severity="error">
          Access denied. Your role ({role || 'unknown'}) does not have access to the course catalog.
        </Alert>
      </Box>
    );
  }

  return <Component />;
};

export default Course;