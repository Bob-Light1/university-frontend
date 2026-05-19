import { Route } from 'react-router-dom';
import { lazy }  from 'react';

import ProtectedRoute from './ProtectedRoute';

// ─── Public pages (no auth required) ─────────────────────────────────────────
const LoginAdmin = lazy(() => import('../admin/components/loginAdmin/LoginAdmin'));

// ─── Protected layout + pages ─────────────────────────────────────────────────
const Admin           = lazy(() => import('../admin/Admin'));
const AdminDashboard  = lazy(() => import('../admin/components/dashboard/AdminDashboard'));
const CampusList      = lazy(() => import('../admin/components/campuses/CampusList'));
const NewCampus       = lazy(() => import('../admin/components/newCampus/NewCampus'));
const AdminAccounts   = lazy(() => import('../admin/components/accounts/AdminAccounts'));
const AdminProfile    = lazy(() => import('../admin/components/profile/AdminProfile'));

export const adminRoutes = (
  <Route path="/admin">

    {/* ── Public: login ──────────────────────────────────────────────────── */}
    <Route index   element={<LoginAdmin />} />
    <Route path="login" element={<LoginAdmin />} />

    {/* ── Protected: Admin / Director portal ─────────────────────────────── */}
    <Route element={<ProtectedRoute allowedRoles={['ADMIN', 'DIRECTOR']} redirectTo="/admin/login" />}>
      <Route element={<Admin />}>
        <Route path="dashboard"  element={<AdminDashboard />} />
        <Route path="campuses"   element={<CampusList />}     />
        <Route path="new-campus" element={<NewCampus />}      />
        <Route path="accounts"   element={<AdminAccounts />}  />
        <Route path="profile"    element={<AdminProfile />}   />
      </Route>
    </Route>

  </Route>
);
