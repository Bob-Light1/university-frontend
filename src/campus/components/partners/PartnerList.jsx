/**
 * @file PartnerList.jsx
 * @description Data table for the campus partner list.
 *
 * @param {Object[]}  partners       - Current page of partner documents
 * @param {boolean}   loading
 * @param {Object}    pagination     - { page, limit, total, totalPages }
 * @param {Function}  onPageChange
 * @param {Function}  onView         - Opens PartnerDetailDrawer
 * @param {Function}  onEdit         - Opens PartnerForm (edit mode)
 * @param {Function}  onToggleStatus
 * @param {Function}  onArchive
 */

import {
  Box, Table, TableBody, TableCell, TableContainer, TableHead,
  TableRow, TablePagination, Avatar, Typography, Chip, Stack,
  IconButton, Tooltip, Skeleton, Paper,
} from '@mui/material';
import {
  Visibility, Edit, Block, CheckCircle, Delete,
  EmojiEvents,
} from '@mui/icons-material';

// ─── Tier colour map ──────────────────────────────────────────────────────────

const TIER_COLOR = {
  bronze:   '#cd7f32',
  silver:   '#9e9e9e',
  gold:     '#f9a825',
  platinum: '#78909c',
};

const TIER_LABEL = {
  bronze: 'Bronze', silver: 'Silver', gold: 'Gold', platinum: 'Platinum',
};

// ─── Status chip ──────────────────────────────────────────────────────────────

const statusChipColor = (status) =>
  status === 'active' ? 'success' : status === 'suspended' ? 'error' : 'default';

// ─── Skeleton row ─────────────────────────────────────────────────────────────

const SkeletonRow = () => (
  <TableRow>
    {Array.from({ length: 7 }).map((_, i) => (
      <TableCell key={i}><Skeleton variant="text" /></TableCell>
    ))}
  </TableRow>
);

// ─── Component ────────────────────────────────────────────────────────────────

const PartnerList = ({
  partners,
  loading,
  pagination,
  onPageChange,
  onView,
  onEdit,
  onToggleStatus,
  onArchive,
}) => {
  const { page, limit, total } = pagination;

  return (
    <Box>
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
              <TableRow>
                <TableCell colSpan={7} align="center" sx={{ py: 5, color: 'text.secondary' }}>
                  No partners found. Create your first one with the button above.
                </TableCell>
              </TableRow>
            ) : (
              partners.map((partner) => {
                const tierColor = TIER_COLOR[partner.tier] ?? '#9e9e9e';
                const conversion = partner.totalLeads > 0
                  ? Math.round((partner.totalConverted / partner.totalLeads) * 100)
                  : 0;

                return (
                  <TableRow key={partner._id} hover sx={{ cursor: 'pointer' }} onClick={() => onView(partner)}>

                    {/* Partner identity */}
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

                    {/* Code */}
                    <TableCell>
                      <Typography
                        variant="caption"
                        sx={{
                          fontFamily: 'monospace', fontWeight: 700,
                          px: 1, py: 0.3, borderRadius: 1,
                          bgcolor: 'grey.100', letterSpacing: 0.5,
                        }}
                      >
                        {partner.partnerCode || '—'}
                      </Typography>
                    </TableCell>

                    {/* Type */}
                    <TableCell>
                      <Chip
                        label={partner.partnerType === 'institutional' ? 'Institutional' : 'Commercial'}
                        size="small"
                        variant="outlined"
                        sx={{ textTransform: 'capitalize' }}
                      />
                    </TableCell>

                    {/* Tier */}
                    <TableCell>
                      <Stack direction="row" spacing={0.5} alignItems="center">
                        <EmojiEvents sx={{ fontSize: 14, color: tierColor }} />
                        <Typography variant="caption" fontWeight={600} sx={{ color: tierColor }}>
                          {TIER_LABEL[partner.tier] ?? partner.tier}
                        </Typography>
                      </Stack>
                    </TableCell>

                    {/* Leads */}
                    <TableCell>
                      <Typography variant="body2">
                        {partner.totalLeads ?? 0}
                        <Typography component="span" variant="caption" color="text.secondary">
                          {' '}/ {partner.totalConverted ?? 0} enrolled ({conversion}%)
                        </Typography>
                      </Typography>
                    </TableCell>

                    {/* Status */}
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      <Chip
                        label={partner.status}
                        size="small"
                        color={statusChipColor(partner.status)}
                        sx={{ fontWeight: 600, textTransform: 'capitalize' }}
                      />
                    </TableCell>

                    {/* Actions */}
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
                        <Tooltip title="Archive">
                          <IconButton size="small" color="error" onClick={() => onArchive(partner._id)}>
                            <Delete fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </Stack>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <TablePagination
        component="div"
        count={total}
        page={page - 1}
        rowsPerPage={limit}
        rowsPerPageOptions={[10, 20, 50]}
        onPageChange={(_, newPage) => onPageChange(newPage + 1)}
        onRowsPerPageChange={() => {}}
      />
    </Box>
  );
};

export default PartnerList;
