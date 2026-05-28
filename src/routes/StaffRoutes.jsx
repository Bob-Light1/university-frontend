import { Route } from 'react-router-dom';
import { lazy } from 'react';

const StaffDashboard = lazy(() => import('../staff/components/dashboard/StaffDashboard'));
const StaffProfile   = lazy(() => import('../staff/components/profile/StaffProfile'));
const StaffStudents  = lazy(() => import('../staff/components/students/StaffStudents'));
const StaffAttendance = lazy(() => import('../staff/components/attendance/StaffAttendance'));
const StaffResults   = lazy(() => import('../staff/components/results/StaffResults'));
const StaffCourses   = lazy(() => import('../staff/components/courses/StaffCourses'));

export const staffRoutes = (
  <>
    <Route index element={<StaffDashboard />} />
    <Route path="dashboard"   element={<StaffDashboard />} />
    <Route path="profile"     element={<StaffProfile />} />
    <Route path="students"    element={<StaffStudents />} />
    <Route path="attendance"  element={<StaffAttendance />} />
    <Route path="results"     element={<StaffResults />} />
    <Route path="courses"     element={<StaffCourses />} />
  </>
);
