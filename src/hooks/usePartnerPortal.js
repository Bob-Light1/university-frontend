/**
 * @file usePartnerPortal.js
 * @description Partner self-service portal hook.
 *
 * Consumed by: PartnerDashboard, PartnerProfile, MyLeads, MyCommissions, AffiliateKit
 *
 * Loads the authenticated partner's dashboard, leads, and commissions.
 * All reads are campus-isolated by the backend via JWT.
 */

import { useState, useEffect, useCallback } from 'react';
import {
  getMe,
  getMyDashboard,
  getMyLeads,
  getMyCommissions,
  updateMyProfile,
  changeMyPassword,
  uploadMyProfileImage,
  downloadMyKit,
  downloadMyReceipt,
} from '../services/partnerService';

const DEFAULT_LEAD_FILTERS = {
  status: '',
  from:   '',
  to:     '',
  search: '',
  page:   1,
  limit:  20,
};

const DEFAULT_COMMISSION_FILTERS = {
  status: '',
  from:   '',
  to:     '',
  page:   1,
  limit:  20,
};

const usePartnerPortal = () => {
  const [profile,     setProfile]     = useState(null);
  const [dashboard,   setDashboard]   = useState(null);

  const [leads,            setLeads]            = useState([]);
  const [leadPagination,   setLeadPagination]   = useState({ page: 1, limit: 20, total: 0, totalPages: 1 });
  const [leadFilters,      setLeadFilters]      = useState(DEFAULT_LEAD_FILTERS);

  const [commissions,         setCommissions]         = useState([]);
  const [commissionPagination,setCommissionPagination]= useState({ page: 1, limit: 20, total: 0, totalPages: 1 });
  const [commissionFilters,   setCommissionFilters]   = useState(DEFAULT_COMMISSION_FILTERS);

  const [profileLoading,    setProfileLoading]    = useState(false);
  const [dashboardLoading,  setDashboardLoading]  = useState(false);
  const [leadsLoading,      setLeadsLoading]      = useState(false);
  const [commissionsLoading,setCommissionsLoading]= useState(false);
  const [error,             setError]             = useState(null);

  // ─── Profile ────────────────────────────────────────────────────────────────

  const fetchProfile = useCallback(async () => {
    setProfileLoading(true);
    try {
      const res = await getMe();
      setProfile(res.data?.data ?? res.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load profile.');
    } finally {
      setProfileLoading(false);
    }
  }, []);

  useEffect(() => { fetchProfile(); }, [fetchProfile]);

  // ─── Dashboard ──────────────────────────────────────────────────────────────

  const fetchDashboard = useCallback(async () => {
    setDashboardLoading(true);
    try {
      const res = await getMyDashboard();
      setDashboard(res.data?.data ?? res.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load dashboard.');
    } finally {
      setDashboardLoading(false);
    }
  }, []);

  useEffect(() => { fetchDashboard(); }, [fetchDashboard]);

  // ─── Leads ──────────────────────────────────────────────────────────────────

  const fetchLeads = useCallback(async () => {
    setLeadsLoading(true);
    const params = { ...leadFilters };
    Object.keys(params).forEach((k) => {
      if (params[k] === '' || params[k] == null) delete params[k];
    });
    try {
      const res = await getMyLeads(params);
      const raw = res.data;
      setLeads(Array.isArray(raw?.data) ? raw.data : []);
      if (raw?.pagination) setLeadPagination((p) => ({ ...p, ...raw.pagination }));
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load leads.');
      setLeads([]);
    } finally {
      setLeadsLoading(false);
    }
  }, [leadFilters]);

  useEffect(() => { fetchLeads(); }, [fetchLeads]);

  // ─── Commissions ────────────────────────────────────────────────────────────

  const fetchCommissions = useCallback(async () => {
    setCommissionsLoading(true);
    const params = { ...commissionFilters };
    Object.keys(params).forEach((k) => {
      if (params[k] === '' || params[k] == null) delete params[k];
    });
    try {
      const res = await getMyCommissions(params);
      const raw = res.data;
      setCommissions(Array.isArray(raw?.data) ? raw.data : []);
      if (raw?.pagination) setCommissionPagination((p) => ({ ...p, ...raw.pagination }));
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load commissions.');
      setCommissions([]);
    } finally {
      setCommissionsLoading(false);
    }
  }, [commissionFilters]);

  useEffect(() => { fetchCommissions(); }, [fetchCommissions]);

  // ─── Filter helpers ─────────────────────────────────────────────────────────

  const handleLeadFilterChange = useCallback((key, value) => {
    setLeadFilters((prev) => ({ ...prev, [key]: value, page: 1 }));
  }, []);

  const handleCommissionFilterChange = useCallback((key, value) => {
    setCommissionFilters((prev) => ({ ...prev, [key]: value, page: 1 }));
  }, []);

  // ─── Profile mutations ───────────────────────────────────────────────────────

  const saveProfile = useCallback(async (data) => {
    const res = await updateMyProfile(data);
    await fetchProfile();
    return res.data;
  }, [fetchProfile]);

  const savePassword = useCallback(async (data) => {
    const res = await changeMyPassword(data);
    return res.data;
  }, []);

  const saveProfileImage = useCallback(async (profileImageUrl) => {
    const res = await uploadMyProfileImage(profileImageUrl);
    await fetchProfile();
    return res.data;
  }, [fetchProfile]);

  // ─── Kit download ────────────────────────────────────────────────────────────

  const downloadKit = useCallback(async () => {
    const res = await downloadMyKit('qr');
    const url = URL.createObjectURL(new Blob([res.data]));
    const a   = document.createElement('a');
    a.href    = url;
    a.download = `affiliate_kit_${new Date().toISOString().slice(0, 10)}.png`;
    a.click();
    URL.revokeObjectURL(url);
  }, []);

  // ─── Receipt download ────────────────────────────────────────────────────────

  const downloadReceipt = useCallback(async (commissionId) => {
    const res = await downloadMyReceipt(commissionId);
    const url = URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }));
    const a   = document.createElement('a');
    a.href    = url;
    a.download = `receipt_${commissionId}.pdf`;
    a.click();
    URL.revokeObjectURL(url);
  }, []);

  return {
    // Profile
    profile,
    profileLoading,
    saveProfile,
    savePassword,
    saveProfileImage,

    // Dashboard
    dashboard,
    dashboardLoading,
    fetchDashboard,

    // Leads
    leads,
    leadPagination,
    leadFilters,
    leadsLoading,
    handleLeadFilterChange,
    setLeadPage: (page) => setLeadFilters((f) => ({ ...f, page })),
    fetchLeads,

    // Commissions
    commissions,
    commissionPagination,
    commissionFilters,
    commissionsLoading,
    handleCommissionFilterChange,
    setCommissionPage: (page) => setCommissionFilters((f) => ({ ...f, page })),
    fetchCommissions,
    downloadReceipt,

    // Kit
    downloadKit,

    // Global error
    error,
  };
};

export default usePartnerPortal;
