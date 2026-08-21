import { Route } from 'react-router-dom';
import { lazy }  from 'react';

/**
 * `FeatureGuard` is composed with the `ProtectedRoute` already wrapping this
 * table in `App.jsx`, never substituted for it: the role check and the
 * entitlement check answer different questions (design doc §8.2). It turns a
 * direct URL to a module this campus does not have into an explicit
 * "not activated" screen rather than a page that loads and then 403s.
 * `read_only` passes — the history stays readable (§4.1).
 */
import FeatureGuard from './FeatureGuard';

const MentorDashboard  = lazy(() => import('../mentor/components/dashboard/MentorDashboard'));
const MentorStudents   = lazy(() => import('../mentor/components/students/MentorStudents'));
const MentorResults    = lazy(() => import('../mentor/components/results/MentorResults'));
const MentorAttendance = lazy(() => import('../mentor/components/attendance/MentorAttendance'));
const MentorCourses    = lazy(() => import('../mentor/components/courses/MentorCourses'));
const MentorProfile    = lazy(() => import('../mentor/components/profile/MentorProfile'));
const NotifMentor      = lazy(() => import('../mentor/components/notification/NotifMentor'));

export const mentorRoutes = (
  <>
    <Route index               element={<MentorDashboard />} />
    <Route path="students"     element={<MentorStudents />} />
    <Route path="results"      element={<FeatureGuard feature="result"><MentorResults /></FeatureGuard>} />
    <Route path="attendance"   element={<MentorAttendance />} />
    <Route path="courses"      element={<FeatureGuard feature="course"><MentorCourses /></FeatureGuard>} />
    <Route path="profile"      element={<MentorProfile />} />
    <Route path="notification" element={<FeatureGuard feature="announcement"><NotifMentor /></FeatureGuard>} />
  </>
);
