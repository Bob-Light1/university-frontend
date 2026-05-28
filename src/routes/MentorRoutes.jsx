import { Route } from 'react-router-dom';
import { lazy }  from 'react';

const MentorDashboard  = lazy(() => import('../mentor/components/dashboard/MentorDashboard'));
const MentorStudents   = lazy(() => import('../mentor/components/students/MentorStudents'));
const MentorResults    = lazy(() => import('../mentor/components/results/MentorResults'));
const MentorAttendance = lazy(() => import('../mentor/components/attendance/MentorAttendance'));
const MentorCourses    = lazy(() => import('../mentor/components/courses/MentorCourses'));
const MentorProfile    = lazy(() => import('../mentor/components/profile/MentorProfile'));

export const mentorRoutes = (
  <>
    <Route index              element={<MentorDashboard />} />
    <Route path="students"   element={<MentorStudents />} />
    <Route path="results"    element={<MentorResults />} />
    <Route path="attendance" element={<MentorAttendance />} />
    <Route path="courses"    element={<MentorCourses />} />
    <Route path="profile"    element={<MentorProfile />} />
  </>
);
