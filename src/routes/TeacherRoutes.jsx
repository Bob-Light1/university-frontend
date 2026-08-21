import { Route } from 'react-router-dom';
import { lazy } from 'react';

/**
 * `FeatureGuard` is composed with the `ProtectedRoute` already wrapping this
 * table in `App.jsx`, never substituted for it: the role check and the
 * entitlement check answer different questions (design doc §8.2). It turns a
 * direct URL to a module this campus does not have into an explicit
 * "not activated" screen rather than a page that loads and then 403s.
 * `read_only` passes — the history stays readable (§4.1).
 */
import FeatureGuard from './FeatureGuard';

const TeacherDashboard = lazy(() =>
  import('../teacher/components/dashboard/TeacherDashboard')
);
const ScheduleTeacher = lazy(() =>
  import('../teacher/components/schedule/ScheduleTeacher')
);
const ExamTeacher = lazy(() =>
  import('../teacher/components/examination/ExamTeacher')
);
const ResultTeacher = lazy(() =>
  import('../teacher/components/results/ResultTeacher')
);
const CourseTeacher = lazy(() =>
  import('../teacher/components/courses/CourseTeacher')
);
const AttendanceTeacher = lazy(() =>
  import('../teacher/components/attendance/AttendanceTeacher')
);
const NotifTeacher = lazy(() =>
  import('../teacher/components/notification/NotifTeacher')
);
const DocumentTeacher = lazy(() =>
  import('../teacher/components/documents/DocumentTeacher')
);
const TeacherProfile = lazy(() =>
  import('../teacher/components/profile/TeacherProfile')
);

export const teacherRoutes = (
  <>
    <Route index element={<TeacherDashboard />} />
    <Route path="schedule"    element={<ScheduleTeacher />} />
    <Route path="examination" element={<FeatureGuard feature="exam"><ExamTeacher /></FeatureGuard>} />
    <Route path="results"     element={<FeatureGuard feature="result"><ResultTeacher /></FeatureGuard>} />
    <Route path="courses"     element={<FeatureGuard feature="course"><CourseTeacher /></FeatureGuard>} />
    <Route path="attendance"  element={<AttendanceTeacher />} />
    <Route path="notification" element={<FeatureGuard feature="announcement"><NotifTeacher /></FeatureGuard>} />
    <Route path="documents"   element={<FeatureGuard feature="document"><DocumentTeacher /></FeatureGuard>} />
    <Route path="profile"     element={<TeacherProfile />} />
  </>
);