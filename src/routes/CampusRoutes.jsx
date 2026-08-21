/**
 * @file CampusRoutes.jsx
 * @description Campus-manager route table.
 *
 * `FeatureGuard` is COMPOSED with the `ProtectedRoute` + `CampusGuard` pair
 * already wrapping this table in `App.jsx`, never substituted for it: role,
 * tenant membership and entitlement are three separate questions (entitlement
 * design doc §8.2). It answers the direct-URL case — a bookmark, an old link —
 * with an explicit "module not activated" screen instead of a page that loads
 * and then fills with 403s.
 *
 * `read_only` passes the guard on purpose: the history stays readable and only
 * the mutating affordances inside the page are withheld (§4.1).
 *
 * Routes with no guard are the ungated ones — dashboard, settings and the
 * screens served by `core` modules.
 */

import { Route } from 'react-router-dom';
import { lazy } from 'react';

import FeatureGuard from './FeatureGuard';

// Lazy-loaded pages
const Dashboard = lazy(() =>
  import('../campus/components/dashboard/Dashboard')
);
const Students = lazy(() =>
  import('../campus/components/students/Students')
);
const Teachers = lazy(() =>
  import('../campus/components/teachers/Teachers')
);
const Parents = lazy(() =>
  import('../campus/components/parents/Parents')
);
const Classes = lazy(() =>
  import('../campus/components/classes/Classes')
);
const Subjects = lazy(() =>
  import('../campus/components/subjects/Subjects')
);
const Schedule = lazy(() =>
  import('../campus/components/schedule/Schedule')
);
const Examination = lazy(() =>
  import('../campus/components/examination/Examination')
);
const Results = lazy(() =>
  import('../campus/components/results/Results')
);
const Courses = lazy(() =>
  import('../campus/components/courses/Course')
);
const Attendance = lazy(() =>
  import('../campus/components/attendance/Attendance')
);
const Notification = lazy(() =>
  import('../campus/components/notification/Notification')
);
const NotificationLog = lazy(() =>
  import('../campus/components/notification/NotificationLog')
);
const Document = lazy(() =>
  import('../campus/components/documents/Document')
);
const Print = lazy(() =>
  import('../campus/components/print/Print')
);
const Partner = lazy(() =>
  import('../campus/components/partners/Partner')
);
const Finance = lazy(() =>
  import('../campus/components/finance/Finance')
);
const CampusStaff = lazy(() =>
  import('../campus/components/staff/CampusStaff')
);
const CampusMentors = lazy(() =>
  import('../campus/components/mentors/CampusMentors')
);
const CampusSettings = lazy(() =>
  import('../campus/components/settings/CampusSettings')
);
const ScheduleGaet = lazy(() =>
  import('../campus/components/schedule/ScheduleGaet')
);
const AiAssistant = lazy(() =>
  import('../components/ai/AiAssistant')
);

export const campusRoutes = (
  <>
    <Route index element={<Dashboard />} />
    <Route path="dashboard"     element={<Dashboard />} />
    <Route path="students"      element={<FeatureGuard feature="student"><Students /></FeatureGuard>} />
    <Route path="teachers"      element={<FeatureGuard feature="teacher"><Teachers /></FeatureGuard>} />
    <Route path="parents"       element={<FeatureGuard feature="parent"><Parents /></FeatureGuard>} />
    <Route path="classes"       element={<FeatureGuard feature="class"><Classes /></FeatureGuard>} />
    <Route path="subjects"      element={<FeatureGuard feature="subject"><Subjects /></FeatureGuard>} />
    <Route path="courses"       element={<FeatureGuard feature="course"><Courses /></FeatureGuard>} />
    <Route path="schedule"      element={<Schedule />} />
    <Route path="schedule-gaet" element={<FeatureGuard feature="gaet"><ScheduleGaet /></FeatureGuard>} />
    <Route path="examination"   element={<FeatureGuard feature="exam"><Examination /></FeatureGuard>} />
    <Route path="results"       element={<FeatureGuard feature="result"><Results /></FeatureGuard>} />
    <Route path="attendance"    element={<Attendance />} />
    <Route path="notification"  element={<FeatureGuard feature="announcement"><Notification /></FeatureGuard>} />
    <Route path="notification-log" element={<NotificationLog />} />
    <Route path="documents"     element={<FeatureGuard feature="document"><Document /></FeatureGuard>} />
    <Route path="print"         element={<FeatureGuard feature="academic-print"><Print /></FeatureGuard>} />
    <Route path="partners"      element={<FeatureGuard feature="partner"><Partner /></FeatureGuard>} />
    <Route path="finance"       element={<FeatureGuard feature="finance"><Finance /></FeatureGuard>} />
    <Route path="staff"         element={<FeatureGuard feature="staff"><CampusStaff /></FeatureGuard>} />
    <Route path="mentors"       element={<FeatureGuard feature="mentor"><CampusMentors /></FeatureGuard>} />
    <Route path="settings"      element={<CampusSettings />} />
    <Route path="ai"            element={<FeatureGuard feature="ai"><AiAssistant /></FeatureGuard>} />
  </>
);