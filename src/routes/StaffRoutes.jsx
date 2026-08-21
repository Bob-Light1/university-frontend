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

const StaffDashboard    = lazy(() => import('../staff/components/dashboard/StaffDashboard'));
const StaffProfile      = lazy(() => import('../staff/components/profile/StaffProfile'));
const StaffStudents     = lazy(() => import('../staff/components/students/StaffStudents'));
const StaffAttendance   = lazy(() => import('../staff/components/attendance/StaffAttendance'));
const StaffResults      = lazy(() => import('../staff/components/results/StaffResults'));
const StaffCourses      = lazy(() => import('../staff/components/courses/StaffCourses'));
const StaffAnnouncements = lazy(() => import('../staff/components/announcements/StaffAnnouncements'));
const StaffTeachers     = lazy(() => import('../staff/components/teachers/StaffTeachers'));
const StaffSchedule     = lazy(() => import('../staff/components/schedule/StaffSchedule'));
const StaffDocuments    = lazy(() => import('../staff/components/documents/StaffDocuments'));
const StaffExams        = lazy(() => import('../staff/components/exams/StaffExams'));
const StaffPrint        = lazy(() => import('../staff/components/print/StaffPrint'));

export const staffRoutes = (
  <>
    <Route index           element={<StaffDashboard />} />
    <Route path="dashboard"     element={<StaffDashboard />} />
    <Route path="profile"       element={<StaffProfile />} />
    <Route path="students"      element={<StaffStudents />} />
    <Route path="attendance"    element={<StaffAttendance />} />
    <Route path="results"       element={<FeatureGuard feature="result"><StaffResults /></FeatureGuard>} />
    <Route path="courses"       element={<FeatureGuard feature="course"><StaffCourses /></FeatureGuard>} />
    <Route path="announcements" element={<FeatureGuard feature="announcement"><StaffAnnouncements /></FeatureGuard>} />
    <Route path="teachers"      element={<StaffTeachers />} />
    <Route path="schedule"      element={<StaffSchedule />} />
    <Route path="documents"     element={<FeatureGuard feature="document"><StaffDocuments /></FeatureGuard>} />
    <Route path="exams"         element={<FeatureGuard feature="exam"><StaffExams /></FeatureGuard>} />
    <Route path="print"         element={<FeatureGuard feature="academic-print"><StaffPrint /></FeatureGuard>} />
  </>
);
