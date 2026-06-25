import { Routes, Route } from 'react-router-dom';
import ProtectedRoute from '../src/routes/ProtectedRoute';
import CampusGuard from '../src/routes/CampusGuard';
import CssBaseline from '@mui/material/CssBaseline';
import { GlobalStyles } from '@mui/material';
import { campusRoutes } from './routes/CampusRoutes';
import { partnerRoutes } from './routes/PartnerRoutes';
import { parentRoutes } from './routes/ParentRoutes';
import { studentRoutes } from './routes/StudentRoutes';
import { clientRoutes } from './routes/ClientRoutes';
import { teacherRoutes } from './routes/TeacherRoutes';
import { mentorRoutes }  from './routes/MentorRoutes';
import { staffRoutes }   from './routes/StaffRoutes';
import { lazy, Suspense } from 'react';
import Loader from './components/Loader';
import { adminRoutes }    from './routes/AdminRoutes';
import { directorRoutes } from './routes/DirectorRoutes';


const Campus  = lazy(() => import('../src/campus/Campus'));
const Teacher = lazy(() => import('../src/teacher/Teacher'));
const Student = lazy(() => import('../src/student/Student'));
const Parent  = lazy(() => import('../src/parent/Parent'));
const Partner = lazy(() => import('../src/partner/Partner'));
const Mentor  = lazy(() => import('../src/mentor/Mentor'));
const Staff   = lazy(() => import('../src/staff/Staff'));
const ActivateAccount = lazy(() => import('../src/client/components/activate/ActivateAccount'));



function App() {
  return (
    <>
      <CssBaseline />
      <GlobalStyles styles={{
        'html, body': {
          margin: 0,
          padding: 0,
          scrollbarWidth: 'none',       /* Firefox */
          msOverflowStyle: 'none',     /* IE/Edge */
        },
        'body::-webkit-scrollbar': {
          display: 'none',             /* Chrome, Safari, Opera */
        },
        '#root': {
          margin: 0,
          padding: 0,
        }
      }} />

      <Routes>
        {/* Public client routes */}
        {clientRoutes}

        {/* Public account activation (link mode + offline code mode) */}
        <Route
          path="/activate"
          element={<Suspense fallback={<Loader />}><ActivateAccount /></Suspense>}
        />
        <Route
          path="/activate/:token"
          element={<Suspense fallback={<Loader />}><ActivateAccount /></Suspense>}
        />

        {/* Admin routes (public login + admin dashboard) */}
        {adminRoutes}

        {/* Director routes (DIRECTOR role — read-only oversight portal) */}
        {directorRoutes}

        {/*
         * Campus routes — two-layer protection:
         *   1. ProtectedRoute  → verifies authentication + allowed roles
         *   2. CampusGuard     → verifies the user belongs to this specific campus
         *                        (ADMIN & DIRECTOR bypass the campus isolation check)
         */}
        <Route element={<ProtectedRoute allowedRoles={['ADMIN', 'CAMPUS_MANAGER', 'DIRECTOR']} />}>
          <Route element={<CampusGuard />}>
            <Route path="campus/:campusId" element={<Campus />}>
              {campusRoutes}
            </Route>
          </Route>
        </Route>

        {/* Teacher routes */}
        <Route element={<ProtectedRoute allowedRoles={['TEACHER']} />}>
          <Route path="teacher" element={<Teacher />}>
            {teacherRoutes}
          </Route>
        </Route>

        {/* Student routes */}
        <Route element={<ProtectedRoute allowedRoles={['STUDENT']} />}>
          <Route path="student" element={<Student />}>
            {studentRoutes}
          </Route>
        </Route>

        {/* Parent routes */}
        <Route element={<ProtectedRoute allowedRoles={['PARENT']} />}>
          <Route path="parent" element={<Parent />}>
            {parentRoutes}
          </Route>
        </Route>

        {/* Partner routes */}
        <Route element={<ProtectedRoute allowedRoles={['PARTNER']} />}>
          <Route path="partner" element={<Partner />}>
            {partnerRoutes}
          </Route>
        </Route>

        {/* Mentor routes */}
        <Route element={<ProtectedRoute allowedRoles={['MENTOR']} />}>
          <Route path="mentor" element={<Mentor />}>
            {mentorRoutes}
          </Route>
        </Route>

        {/* Staff routes */}
        <Route element={<ProtectedRoute allowedRoles={['STAFF']} />}>
          <Route path="staff" element={<Staff />}>
            {staffRoutes}
          </Route>
        </Route>
      </Routes>
    </>
  );
}

export default App;