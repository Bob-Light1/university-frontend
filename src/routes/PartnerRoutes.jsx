import { Route } from 'react-router-dom';
import { lazy } from 'react';

const PartnerDashboard = lazy(() =>
  import('../partner/components/dashboard/PartnerDashboard')
);
const PartnerProfile = lazy(() =>
  import('../partner/components/profile/PartnerProfile')
);
const AffiliateKit = lazy(() =>
  import('../partner/components/kit/AffiliateKit')
);
const MyLeads = lazy(() =>
  import('../partner/components/leads/MyLeads')
);
const MyCommissions = lazy(() =>
  import('../partner/components/commissions/MyCommissions')
);
const NotifPartner = lazy(() =>
  import('../partner/components/notification/NotifPartner')
);

export const partnerRoutes = (
  <>
    <Route index                 element={<PartnerDashboard />} />
    <Route path="profile"        element={<PartnerProfile />} />
    <Route path="kit"            element={<AffiliateKit />} />
    <Route path="leads"          element={<MyLeads />} />
    <Route path="commissions"    element={<MyCommissions />} />
    <Route path="notification"   element={<NotifPartner />} />
  </>
);
