import { Route } from 'react-router-dom';
import { lazy } from 'react';

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

export const campusRoutes = (
  <>
    <Route index element={<Dashboard />} />
    <Route path="dashboard"     element={<Dashboard />} />
    <Route path="students"      element={<Students />} />
    <Route path="teachers"      element={<Teachers />} />
    <Route path="parents"       element={<Parents />} />
    <Route path="classes"       element={<Classes />} />
    <Route path="subjects"      element={<Subjects />} />
    <Route path="courses"       element={<Courses />} />
    <Route path="schedule"      element={<Schedule />} />
    <Route path="schedule-gaet" element={<ScheduleGaet />} />
    <Route path="examination"   element={<Examination />} />
    <Route path="results"       element={<Results />} />
    <Route path="attendance"    element={<Attendance />} />
    <Route path="notification"  element={<Notification />} />
    <Route path="notification-log" element={<NotificationLog />} />
    <Route path="documents"     element={<Document />} />
    <Route path="print"         element={<Print />} />
    <Route path="partners"      element={<Partner />} />
    <Route path="finance"       element={<Finance />} />
    <Route path="staff"         element={<CampusStaff />} />
    <Route path="mentors"       element={<CampusMentors />} />
    <Route path="settings"      element={<CampusSettings />} />
  </>
);