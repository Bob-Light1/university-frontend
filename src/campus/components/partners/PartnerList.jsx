/**
 * @file PartnerList.jsx
 * @description Data table (desktop) + card list (mobile) for the campus partner list.
 */

import {
  Box, Table, TableBody, TableCell, TableContainer, TableHead,
  TableRow, TablePagination, Avatar, Typography, Chip, Stack,
  IconButton, Tooltip, Skeleton, Paper, Divider,
} from '@mui/material';
import {
  Visibility, Edit, Block, CheckCircle, Delete, Unarchive, EmojiEvents, Add,
} from '@mui/icons-material';
import {
  TIER_COLOR, TIER_LABEL, partnerStatusColor,
} from '../../../theme/partnerTokens';

// ─── Skeleton ─────────────────────────────────────────────────────────────────

const SkeletonRow = () => (
  <TableRow>
    {Array.from({ length: 7 }).map((_, i) => (
      <TableCell key={i}><Skeleton variant="text" /></TableCell>
    ))}
  </TableRow>
);

const SkeletonCard = () => (
  <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
    <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 1.5 }}>
      <Skeleton variant="circular" width={40} height={40} />
      <Box sx={{ flex: 1 }}>
        <Skeleton variant="text" width="60%" />
        <Skeleton variant="text" width="40%" />
      </Box>
    </Stack>
    <Skeleton variant="text" width="80%" />
    <Skeleton variant="text" width="50%" />
  </Paper>
);

// ─── Mobile card for one partner ──────────────────────────────────────────────

const PartnerCard = ({ partner, onView, onEdit, onToggleStatus, onArchive, onRestore }) => {
  const tierColor  = TIER_COLOR[partner.tier] ?? TIER_COLOR.silver;
  const conversion = partner.totalLeads > 0
    ? Math.round((partner.totalConverted / partner.totalLeads) * 100)
    : 0;

  return (
    <Paper
      variant="outlined"
      sx={{
        p: 2, borderRadius: 2,
        borderLeft: `4px solid ${tierColor}`,
        cursor: 'pointer',
        '&:hover': { boxShadow: 2 },
        transition: 'box-shadow 0.15s',
      }}
      onClick={() => onView(partner)}
    >
      {/* Header row */}
      <Stack direction="row" spacing={1.5} alignItems="flex-start" sx={{ mb: 1 }}>
        <Avatar
          src={partner.profileImage}
          sx={{ width: 44, height: 44, fontSize: '0.9rem', fontWeight: 700, flexShrink: 0 }}
        >
          {partner.firstName?.[0]}{partner.lastName?.[0]}
        </Avatar>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography variant="subtitle2" fontWeight={700} noWrap>
            {partner.firstName} {partner.lastName}
          </Typography>
          <Typography variant="caption" color="text.secondary" noWrap sx={{ display: 'block' }}>
            {partner.email}
          </Typography>
        </Box>
        <Chip
          label={partner.status}
          size="small"
          color={partnerStatusColor(partner.status)}
          sx={{ fontWeight: 600, textTransform: 'capitalize', flexShrink: 0 }}
        />
      </Stack>

      <Divider sx={{ my: 1 }} />

      {/* Meta row */}
      <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 1.5 }} flexWrap="wrap">
        {partner.partnerCode && (
          <Typography
            variant="caption"
            sx={{
              fontFamily: 'monospace', fontWeight: 700,
              px: 1, py: 0.3, borderRadius: 1,
              bgcolor: 'background.neutral', letterSpacing: 0.5,
            }}
          >
            {partner.partnerCode}
          </Typography>
        )}
        <Chip
          label={partner.partnerType === 'institutional' ? 'Institutional' : 'Commercial'}
          size="small"
          variant="outlined"
          sx={{ fontSize: '0.7rem' }}
        />
        <Stack direction="row" spacing={0.5} alignItems="center">
          <EmojiEvents sx={{ fontSize: 13, color: tierColor }} />
          <Typography variant="caption" fontWeight={600} sx={{ color: tierColor }}>
            {TIER_LABEL[partner.tier] ?? partner.tier}
          </Typography>
        </Stack>
        <Typography variant="caption" color="text.secondary">
          {partner.totalLeads ?? 0} leads · {partner.totalConverted ?? 0} enrolled ({conversion}%)
        </Typography>
      </Stack>

      {/* Actions row */}
      <Stack direction="row" spacing={0.5} justifyContent="flex-end" onClick={(e) => e.stopPropagation()}>
        <Tooltip title="View Details">
          <IconButton size="medium" onClick={() => onView(partner)}>
            <Visibility fontSize="small" />
          </IconButton>
        </Tooltip>
        <Tooltip title="Edit">
          <IconButton size="medium" color="info" onClick={() => onEdit(partner)}>
            <Edit fontSize="small" />
          </IconButton>
        </Tooltip>
        {partner.status !== 'archived' && (
          <Tooltip title={partner.status === 'active' ? 'Suspend' : 'Activate'}>
            <IconButton
              size="medium"
              color={partner.status === 'active' ? 'warning' : 'success'}
              onClick={() => onToggleStatus(partner._id, partner.status === 'active' ? 'suspended' : 'active')}
            >
              {partner.status === 'active' ? <Block fontSize="small" /> : <CheckCircle fontSize="small" />}
            </IconButton>
          </Tooltip>
        )}
        {partner.status === 'archived' ? (
          <Tooltip title="Restore">
            <IconButton size="medium" color="success" onClick={() => onRestore(partner)}>
              <Unarchive fontSize="small" />
            </IconButton>
          </Tooltip>
        ) : (
          <Tooltip title="Archive">
            <IconButton size="medium" color="error" onClick={() => onArchive(partner)}>
              <Delete fontSize="small" />
            </IconButton>
          </Tooltip>
        )}
      </Stack>
    </Paper>
  );
};

// ─── Component ────────────────────────────────────────────────────────────────

const PartnerList = ({
  partners, loading, pagination, onPageChange, onLimitChange,
  onView, onEdit, onToggleStatus, onArchive, onRestore,
  onOpenCreate,
}) => {
  const { page, limit, total } = pagination;

  // ─── Empty state ───────────────────────────────────────────────────────────

  const EmptyRow = () => (
    <TableRow>
      <TableCell colSpan={7} align="center" sx={{ py: 6 }}>
        <Stack alignItems="center" spacing={1}>
          <Typography variant="body2" color="text.secondary">
            No partners found.
          </Typography>
          {onOpenCreate && (
            <Chip
              icon={<Add fontSize="small" />}
              label="Add your first partner"
              onClick={onOpenCreate}
              clickable
              color="primary"
              variant="outlined"
              size="small"
            />
          )}
        </Stack>
      </TableCell>
    </TableRow>
  );

  const EmptyCards = () => (
    <Paper variant="outlined" sx={{ p: 5, borderRadius: 2, textAlign: 'center' }}>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
        No partners found.
      </Typography>
      {onOpenCreate && (
        <Chip
          icon={<Add fontSize="small" />}
          label="Add your first partner"
          onClick={onOpenCreate}
          clickable
          color="primary"
          variant="outlined"
          size="small"
        />
      )}
    </Paper>
  );

  return (
    <Box>
      {/* ── Desktop table (md+) ──────────────────────────────────────────────── */}
      <Box sx={{ display: { xs: 'none', md: 'block' } }}>
        <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 2 }}>
          <Table size="small" stickyHeader>
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontWeight: 700 }}>Partner</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Code</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Type</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Tier</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Leads</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Status</TableCell>
                <TableCell align="right" sx={{ fontWeight: 700 }}>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => <SkeletonRow key={i} />)
              ) : partners.length === 0 ? (
                <EmptyRow />
              ) : (
                partners.map((partner) => {
                  const tierColor  = TIER_COLOR[partner.tier] ?? TIER_COLOR.silver;
                  const conversion = partner.totalLeads > 0
                    ? Math.round((partner.totalConverted / partner.totalLeads) * 100)
                    : 0;
                  return (
                    <TableRow
                      key={partner._id}
                      hover
                      sx={{ cursor: 'pointer' }}
                      onClick={() => onView(partner)}
                    >
                      <TableCell>
                        <Stack direction="row" spacing={1.5} alignItems="center">
                          <Avatar
                            src={partner.profileImage}
                            sx={{ width: 36, height: 36, fontSize: '0.85rem', fontWeight: 700 }}
                          >
                            {partner.firstName?.[0]}{partner.lastName?.[0]}
                          </Avatar>
                          <Box>
                            <Typography variant="subtitle2" fontWeight={600} noWrap>
                              {partner.firstName} {partner.lastName}
                            </Typography>
                            <Typography variant="caption" color="text.secondary" noWrap>
                              {partner.email}
                            </Typography>
                          </Box>
                        </Stack>
                      </TableCell>
                      <TableCell>
                        <Typography
                          variant="caption"
                          sx={{
                            fontFamily: 'monospace', fontWeight: 700,
                            px: 1, py: 0.3, borderRadius: 1,
                            bgcolor: 'background.neutral', letterSpacing: 0.5,
                          }}
                        >
                          {partner.partnerCode || '—'}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={partner.partnerType === 'institutional' ? 'Institutional' : 'Commercial'}
                          size="small"
                          variant="outlined"
                          sx={{ textTransform: 'capitalize' }}
                        />
                      </TableCell>
                      <TableCell>
                        <Stack direction="row" spacing={0.5} alignItems="center">
                          <EmojiEvents sx={{ fontSize: 14, color: tierColor }} />
                          <Typography variant="caption" fontWeight={600} sx={{ color: tierColor }}>
                            {TIER_LABEL[partner.tier] ?? partner.tier}
                          </Typography>
                        </Stack>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {partner.totalLeads ?? 0}
                          <Typography component="span" variant="caption" color="text.secondary">
                            {' '}/ {partner.totalConverted ?? 0} enrolled ({conversion}%)
                          </Typography>
                        </Typography>
                      </TableCell>
                      <TableCell onClick={(e) => e.stopPropagation()}>
                        <Chip
                          label={partner.status}
                          size="small"
                          color={partnerStatusColor(partner.status)}
                          sx={{ fontWeight: 600, textTransform: 'capitalize' }}
                        />
                      </TableCell>
                      <TableCell align="right" onClick={(e) => e.stopPropagation()}>
                        <Stack direction="row" spacing={0.5} justifyContent="flex-end">
                          <Tooltip title="View Details">
                            <IconButton size="small" onClick={() => onView(partner)}>
                              <Visibility fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Edit">
                            <IconButton size="small" color="info" onClick={() => onEdit(partner)}>
                              <Edit fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          {partner.status !== 'archived' && (
                            <Tooltip title={partner.status === 'active' ? 'Suspend' : 'Activate'}>
                              <IconButton
                                size="small"
                                color={partner.status === 'active' ? 'warning' : 'success'}
                                onClick={() => onToggleStatus(
                                  partner._id,
                                  partner.status === 'active' ? 'suspended' : 'active',
                                )}
                              >
                                {partner.status === 'active'
                                  ? <Block fontSize="small" />
                                  : <CheckCircle fontSize="small" />}
                              </IconButton>
                            </Tooltip>
                          )}
                          {partner.status === 'archived' ? (
                            <Tooltip title="Restore">
                              <IconButton size="small" color="success" onClick={() => onRestore(partner)}>
                                <Unarchive fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          ) : (
                            <Tooltip title="Archive">
                              <IconButton size="small" color="error" onClick={() => onArchive(partner)}>
                                <Delete fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          )}
                        </Stack>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Box>

      {/* ── Mobile cards (xs/sm) ─────────────────────────────────────────────── */}
      <Box sx={{ display: { xs: 'block', md: 'none' } }}>
        {loading ? (
          <Stack spacing={1.5}>
            {Array.from({ length: 5 }).map((_, i) => <SkeletonCard key={i} />)}
          </Stack>
        ) : partners.length === 0 ? (
          <EmptyCards />
        ) : (
          <Stack spacing={1.5}>
            {partners.map((partner) => (
              <PartnerCard
                key={partner._id}
                partner={partner}
                onView={onView}
                onEdit={onEdit}
                onToggleStatus={onToggleStatus}
                onArchive={onArchive}
                onRestore={onRestore}
              />
            ))}
          </Stack>
        )}
      </Box>

      <TablePagination
        component="div"
        count={total}
        page={page - 1}
        rowsPerPage={limit}
        rowsPerPageOptions={[10, 20, 50]}
        onPageChange={(_, newPage) => onPageChange(newPage + 1)}
        onRowsPerPageChange={
          onLimitChange ? (e) => onLimitChange(parseInt(e.target.value, 10)) : undefined
        }
      />
    </Box>
  );
};

export default PartnerList;
