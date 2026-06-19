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
const AdminAccounts       = lazy(() => import('../admin/components/accounts/AdminAccounts'));
const AdminProfile        = lazy(() => import('../admin/components/profile/AdminProfile'));
const AdminAnnouncements  = lazy(() => import('../admin/components/announcements/AdminAnnouncements'));

// ─── Phase 2 — Portal content management ──────────────────────────────────────
const TestimonialsAdmin   = lazy(() => import('../admin/components/portal/TestimonialsAdmin'));
const FaqAdmin            = lazy(() => import('../admin/components/portal/FaqAdmin'));
const CoursesAdmin        = lazy(() => import('../admin/components/portal/CoursesAdmin'));
const CompetitionAdmin    = lazy(() => import('../admin/components/portal/CompetitionAdmin'));

// ─── Phase 3 — Partner applications review ────────────────────────────────────
const PartnerApplicationsAdmin = lazy(() => import('../admin/components/portal/PartnerApplicationsAdmin'));

export const adminRoutes = (
  <Route path="/admin">

    {/* ── Public: login ──────────────────────────────────────────────────── */}
    <Route index   element={<LoginAdmin />} />
    <Route path="login" element={<LoginAdmin />} />

    {/* ── Protected: Admin portal (ADMIN only) ───────────────────────────── */}
    {/* Directors have their own dedicated portal at /director. Several pages here
        (accounts, status changes, account creation) call ADMIN-only backend
        endpoints, so granting DIRECTOR access produced silent 403s. */}
    <Route element={<ProtectedRoute allowedRoles={['ADMIN']} redirectTo="/admin/login" />}>
      <Route element={<Admin />}>
        <Route path="dashboard"  element={<AdminDashboard />} />
        <Route path="campuses"   element={<CampusList />}     />
        <Route path="new-campus" element={<NewCampus />}      />
        <Route path="accounts"       element={<AdminAccounts />}      />
        <Route path="profile"        element={<AdminProfile />}       />
        <Route path="announcements"  element={<AdminAnnouncements />} />

        {/* Phase 2 — Portal content */}
        <Route path="portal/testimonials" element={<TestimonialsAdmin />} />
        <Route path="portal/faq"          element={<FaqAdmin />}          />
        <Route path="portal/courses"      element={<CoursesAdmin />}      />
        <Route path="portal/competition"  element={<CompetitionAdmin />}  />

        {/* Phase 3 — Partner applications */}
        <Route path="portal/applications" element={<PartnerApplicationsAdmin />} />
      </Route>
    </Route>

  </Route>
);
