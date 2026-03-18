import { Route } from 'react-router-dom';
import { lazy } from 'react';

const StudentDetails = lazy(() =>
  import('../student/components/studentDetails/StudentDetails')
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

export const studentRoutes = (
  <>
    <Route index element={<StudentDetails />} />
    <Route path="schedule"   element={<ScheduleStudent />} />
    <Route path="examination" element={<ExamStudent />} />
    <Route path="results"    element={<ResultStudent />} />
    <Route path='courses' element={<CourseStudent />} />
    <Route path="attendance" element={<AttendanceStudent />} />
    <Route path="notification" element={<NotifStudent />} />
    <Route path="documents"  element={<DocumentStudent />} />
  </>
);