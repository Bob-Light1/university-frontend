import { Route } from 'react-router-dom';
import { lazy }  from 'react';

import ProtectedRoute from './ProtectedRoute';

const Director          = lazy(() => import('../director/Director'));
const DirectorDashboard = lazy(() => import('../director/components/dashboard/DirectorDashboard'));
const DirectorCampuses  = lazy(() => import('../director/components/campuses/DirectorCampuses'));
const DirectorProfile   = lazy(() => import('../director/components/profile/DirectorProfile'));

export const directorRoutes = (
  <Route path="/director">
    <Route element={<ProtectedRoute allowedRoles={['DIRECTOR']} redirectTo="/admin" />}>
      <Route element={<Director />}>
        <Route index        element={<DirectorDashboard />} />
        <Route path="dashboard" element={<DirectorDashboard />} />
        <Route path="campuses"  element={<DirectorCampuses />}  />
        <Route path="profile"   element={<DirectorProfile />}   />
      </Route>
    </Route>
  </Route>
);
