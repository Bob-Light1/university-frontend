/**
 * @file PartnerManager.jsx
 * @description Campus Manager — Partner list orchestrator.
 *
 * Renders KPI cards, filter bar, data table, create/edit dialog,
 * and detail drawer. All state is driven by usePartner hook.
 */

import { useState, useMemo } from 'react';
import {
  Box, Button, Stack, Typography, Drawer, Snackbar, Alert,
  useTheme,
} from '@mui/material';
import { Add, FileDownload, Handshake, People, TrendingUp, EmojiEvents } from '@mui/icons-material';
import ConfirmActionDialog from '../../../components/shared/ConfirmActionDialog';
import { BRAND_ORANGE, BRAND_GRADIENT_BTN, BRAND_SHADOW } from '../../../theme/partnerTokens';

import usePartner from '../../../hooks/usePartner';
import KPICards   from '../../../components/shared/KpiCard';
import useFormSnackbar from '../../../hooks/useFormSnackBar';

import PartnerFilters    from './PartnerFilters';
import PartnerList       from './PartnerList';
import PartnerForm       from './PartnerForm';
import PartnerDetailDrawer from './PartnerDetailDrawer';

// ─── Component ────────────────────────────────────────────────────────────────

const PartnerManager = () => {
  const theme = useTheme();

  const {
    partners, pagination, filters, loading, error,
    fetch, handleFilterChange, handleReset, setPage,
    changeStatus, removePartner, unarchivePartner, refreshQR, downloadCSV,
  } = usePartner();

  const { snackbar, showSnackbar, closeSnackbar } = useFormSnackbar();

  const [formOpen,       setFormOpen]       = useState(false);
  const [editTarget,     setEditTarget]     = useState(null);
  const [drawerOpen,     setDrawerOpen]     = useState(false);
  const [viewTarget,     setViewTarget]     = useState(null);
  const [confirmDialog,  setConfirmDialog]  = useState({ open: false, action: 'archive', partner: null, busy: false });

  // ─── Derived KPIs ──────────────────────────────────────────────────────────

  const kpiMetrics = useMemo(() => {
    const activeCount = partners.filter((p) => p.status === 'active').length;
    const totalLeads  = partners.reduce((s, p) => s + (p.totalLeads ?? 0), 0);
    const totalConv   = partners.reduce((s, p) => s + (p.totalConverted ?? 0), 0);
    const convRate    = totalLeads > 0 ? Math.round((totalConv / totalLeads) * 100) : 0;

    return [
      {
        label:    'Total Partners',
        value:    pagination.total,
        icon:     <Handshake sx={{ fontSize: 28 }} />,
        color:    BRAND_ORANGE,
        subtitle: 'Registered on this campus',
      },
      {
        label:    'Active Partners',
        value:    activeCount,
        icon:     <People sx={{ fontSize: 28 }} />,
        color:    theme.palette.success.main,
        subtitle: 'Currently active (this page)',
      },
      {
        label:    'Total Leads',
        value:    totalLeads,
        icon:     <TrendingUp sx={{ fontSize: 28 }} />,
        color:    theme.palette.info.main,
        subtitle: 'Prospects attributed',
      },
      {
        label:    'Conversion Rate',
        value:    `${convRate}%`,
        icon:     <EmojiEvents sx={{ fontSize: 28 }} />,
        color:    theme.palette.warning.main,
        subtitle: 'Leads → enrolled',
      },
    ];
  }, [partners, pagination.total, theme]);

  // ─── Handlers ───────────────────────────────────────────────────────────────

  const handleOpenCreate = () => {
    setEditTarget(null);
    setFormOpen(true);
  };

  const handleOpenEdit = (partner) => {
    if (document.activeElement instanceof HTMLElement) document.activeElement.blur();
    setDrawerOpen(false);
    setEditTarget(partner);
    setFormOpen(true);
  };

  const handleOpenView = (partner) => {
    setViewTarget(partner);
    setDrawerOpen(true);
  };

  const handleCloseDrawer = () => {
    if (document.activeElement instanceof HTMLElement) document.activeElement.blur();
    setDrawerOpen(false);
    setViewTarget(null);
  };

  const handleFormSuccess = () => {
    setFormOpen(false);
    showSnackbar('Partner saved successfully.', 'success');
  };

  const handleToggleStatus = async (id, status) => {
    try {
      await changeStatus(id, status);
      showSnackbar(`Partner status changed to ${status}.`, 'success');
      if (viewTarget?._id === id) {
        setViewTarget((prev) => prev ? { ...prev, status } : prev);
      }
    } catch (err) {
      showSnackbar(err.response?.data?.message || 'Failed to change status.', 'error');
    }
  };

  const handleAskArchive = (partner) => {
    setConfirmDialog({ open: true, action: 'archive', partner, busy: false });
    setDrawerOpen(false);
  };

  const handleAskRestore = (partner) => {
    setConfirmDialog({ open: true, action: 'restore', partner, busy: false });
    setDrawerOpen(false);
  };

  const handleConfirmAction = async () => {
    const { action, partner } = confirmDialog;
    setConfirmDialog((prev) => ({ ...prev, busy: true }));
    try {
      if (action === 'archive') {
        await removePartner(partner._id);
        showSnackbar('Partner archived.', 'success');
      } else {
        await unarchivePartner(partner._id);
        showSnackbar('Partner restored.', 'success');
      }
    } catch (err) {
      showSnackbar(err.response?.data?.message || `Failed to ${action} partner.`, 'error');
    } finally {
      setConfirmDialog((prev) => ({ ...prev, open: false, busy: false }));
    }
  };

  const handleRegenerateQR = async (id) => {
    try {
      await refreshQR(id);
      showSnackbar('QR code regenerated.', 'success');
    } catch {
      showSnackbar('Failed to regenerate QR code.', 'error');
    }
  };

  const handleDownloadCSV = async () => {
    try {
      await downloadCSV();
    } catch {
      showSnackbar('Export failed.', 'error');
    }
  };

  // ─── Render ─────────────────────────────────────────────────────────────────

  return (
    <Box sx={{ p: { xs: 2, md: 3 } }}>

      {/* ── Header ────────────────────────────────────────────────────────────── */}
      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        justifyContent="space-between"
        alignItems={{ xs: 'flex-start', sm: 'center' }}
        spacing={1}
        sx={{ mb: 2.5 }}
      >
        <Box>
          <Typography variant="h5" fontWeight={700}>
            Partner Management
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Manage referral partners, track leads and commissions.
          </Typography>
        </Box>
        <Stack direction="row" spacing={1} sx={{ alignSelf: { xs: 'flex-end', sm: 'auto' } }}>
          <Button
            size="small"
            variant="outlined"
            startIcon={<FileDownload />}
            onClick={handleDownloadCSV}
            sx={{ textTransform: 'none', borderRadius: 2 }}
          >
            Export CSV
          </Button>
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={handleOpenCreate}
            sx={{
              textTransform: 'none', fontWeight: 700, borderRadius: 2,
              background: BRAND_GRADIENT_BTN,
              boxShadow: BRAND_SHADOW,
            }}
          >
            Add Partner
          </Button>
        </Stack>
      </Stack>

      {/* ── KPI Cards ─────────────────────────────────────────────────────────── */}
      {!loading && (
        <Box sx={{ mb: 2.5 }}>
          <KPICards metrics={kpiMetrics} />
        </Box>
      )}

      {/* ── Error ─────────────────────────────────────────────────────────────── */}
      {error && (
        <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }} onClose={fetch}>
          {error}
        </Alert>
      )}

      {/* ── Filters ───────────────────────────────────────────────────────────── */}
      <PartnerFilters
        filters={filters}
        onFilterChange={handleFilterChange}
        onReset={handleReset}
      />

      {/* ── Table ─────────────────────────────────────────────────────────────── */}
      <PartnerList
        partners={partners}
        loading={loading}
        pagination={pagination}
        onPageChange={setPage}
        onView={handleOpenView}
        onEdit={handleOpenEdit}
        onToggleStatus={handleToggleStatus}
        onArchive={(partner) => handleAskArchive(partner)}
        onRestore={(partner) => handleAskRestore(partner)}
        onOpenCreate={handleOpenCreate}
      />

      {/* ── Create / Edit Dialog ──────────────────────────────────────────────── */}
      <PartnerForm
        open={formOpen}
        partner={editTarget}
        onClose={() => setFormOpen(false)}
        onSuccess={handleFormSuccess}
      />

      {/* ── Detail Drawer ─────────────────────────────────────────────────────── */}
      <Drawer
        anchor="right"
        open={drawerOpen}
        onClose={handleCloseDrawer}
        disableEnforceFocus
        slotProps={{ paper: { sx: { width: { xs: '100vw', sm: 480 }, borderRadius: { sm: '16px 0 0 16px' } } } }}
      >
        <PartnerDetailDrawer
          entity={viewTarget}
          onClose={handleCloseDrawer}
          onEdit={handleOpenEdit}
          onToggleStatus={handleToggleStatus}
          onArchive={(p) => handleAskArchive(p)}
          onRestore={(p) => handleAskRestore(p)}
          onRegenerateQR={handleRegenerateQR}
        />
      </Drawer>

      {/* ── Archive / Restore confirm ─────────────────────────────────────────── */}
      <ConfirmActionDialog
        open={confirmDialog.open}
        action={confirmDialog.action}
        entityLabel={
          confirmDialog.partner
            ? `${confirmDialog.partner.firstName} ${confirmDialog.partner.lastName}`
            : ''
        }
        entityType="partner"
        busy={confirmDialog.busy}
        onClose={() => setConfirmDialog((prev) => ({ ...prev, open: false }))}
        onConfirm={handleConfirmAction}
      />

      {/* ── Snackbar ──────────────────────────────────────────────────────────── */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={closeSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert severity={snackbar.severity} variant="filled" onClose={closeSnackbar} sx={{ borderRadius: 2 }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default PartnerManager;
