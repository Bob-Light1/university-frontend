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

const StudentDashboard = lazy(() =>
  import('../student/components/dashboard/StudentDashboard')
);
const ScheduleStudent = lazy(() =>
  import('../student/components/schedule/ScheduleStudent')
);
const ExamStudent = lazy(() =>
  import('../student/components/examination/ExamStudent')
);
const ResultStudent = lazy(() =>
  import('../student/components/results/ResultStudent')
);
const CourseStudent = lazy(() =>
  import('../student/components/courses/CourseStudent')
);
const AttendanceStudent = lazy(() =>
  import('../student/components/attendance/AttendanceStudent')
);
const NotifStudent = lazy(() =>
  import('../student/components/notification/NotifStudent')
);
const DocumentStudent = lazy(() =>
  import('../student/components/documents/DocumentStudent')
);
const StudentProfile = lazy(() =>
  import('../student/components/profile/StudentProfile')
);
const StudentFinance = lazy(() =>
  import('../student/components/finance/StudentFinance')
);

export const studentRoutes = (
  <>
    <Route index element={<StudentDashboard />} />
    <Route path="schedule"    element={<ScheduleStudent />} />
    <Route path="examination" element={<FeatureGuard feature="exam"><ExamStudent /></FeatureGuard>} />
    <Route path="results"     element={<FeatureGuard feature="result"><ResultStudent /></FeatureGuard>} />
    <Route path="courses"     element={<FeatureGuard feature="course"><CourseStudent /></FeatureGuard>} />
    <Route path="attendance"  element={<AttendanceStudent />} />
    <Route path="notification" element={<FeatureGuard feature="announcement"><NotifStudent /></FeatureGuard>} />
    <Route path="documents"   element={<FeatureGuard feature="document"><DocumentStudent /></FeatureGuard>} />
    <Route path="finance"     element={<FeatureGuard feature="finance"><StudentFinance /></FeatureGuard>} />
    <Route path="profile"     element={<StudentProfile />} />
  </>
);