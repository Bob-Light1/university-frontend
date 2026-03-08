import { Route } from 'react-router-dom';
import { lazy} from 'react';

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
const Attendance = lazy(() =>
  import('../campus/components/attendance/Attendance')
);
const Notification = lazy(() =>
  import('../campus/components/notification/Notification')
);

export const campusRoutes = (
  <>
    <Route index element={<Dashboard />} />
    <Route path="dashboard" element={<Dashboard />} />
    <Route path="students" element={<Students />} />
    <Route path="teachers" element={<Teachers />} />
    <Route path="parents" element={<Parents />} />
    <Route path="classes" element={<Classes />} />
    <Route path="subjects" element={<Subjects />} />
    <Route path="schedule" element={<Schedule />} />
    <Route path="examination" element={<Examination />} />
     <Route path="results" element={<Results /> } />
    <Route path="attendance" element={<Attendance />} />
    <Route path="notification" element={<Notification />} />
  </>
); 



