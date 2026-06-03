import { Route } from 'react-router-dom';
import { lazy } from 'react';

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
    <Route path="results"       element={<StaffResults />} />
    <Route path="courses"       element={<StaffCourses />} />
    <Route path="announcements" element={<StaffAnnouncements />} />
    <Route path="teachers"      element={<StaffTeachers />} />
    <Route path="schedule"      element={<StaffSchedule />} />
    <Route path="documents"     element={<StaffDocuments />} />
    <Route path="exams"         element={<StaffExams />} />
    <Route path="print"         element={<StaffPrint />} />
  </>
);
