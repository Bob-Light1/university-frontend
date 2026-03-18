import { Route } from 'react-router-dom';
import { lazy } from 'react';

const TeacherDetails = lazy(() =>
  import('../teacher/components/teacherDetails/TeacherDetails')
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

export const teacherRoutes = (
  <>
    <Route index element={<TeacherDetails />} />
    <Route path="schedule"   element={<ScheduleTeacher />} />
    <Route path="examination" element={<ExamTeacher />} />
    <Route path="results"    element={<ResultTeacher />} />
    <Route path="courses"    element={<CourseTeacher />} />
    <Route path="attendance" element={<AttendanceTeacher />} />
    <Route path="notification" element={<NotifTeacher />} />
    <Route path="documents"  element={<DocumentTeacher />} />
  </>
);