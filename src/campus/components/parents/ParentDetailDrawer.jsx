import {
  Box, IconButton, Typography, Avatar, Stack, Divider,
  Chip, Button, List, ListItem, ListItemIcon, ListItemText,
  Paper, Grid,
} from '@mui/material';
import {
  Close, Edit, Email, Phone, Domain, Badge, Cake,
  Person, Male, Female, Archive, Restore, FamilyRestroom,
  ChildCare, Language, NotificationsActive,
} from '@mui/icons-material';
import { IMAGE_BASE_URL } from '../../../config/env';
import { fDate } from '../../../utils/dateFormat';

/**
 * PARENT DETAIL DRAWER
 *
 * Displays the complete admin-facing profile of a parent.
 *
 * @param {Object}   props.entity    - Populated parent document
 * @param {Function} props.onClose
 * @param {Function} props.onEdit
 * @param {Function} props.onArchive
 * @param {Function} props.onRestore
 */
const ParentDetailDrawer = ({ entity: parent, onClose, onEdit, onArchive, onRestore }) => {
  if (!parent) return null;

  // ── Helpers ────────────────────────────────────────────────────────────────

  const calculateAge = (dateOfBirth) => {
    if (!dateOfBirth) return null;
    const today     = new Date();
    const birthDate = new Date(dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) age--;
    return age;
  };

  const age = calculateAge(parent.dateOfBirth);

  const profileImageUrl = parent.profileImage
    ? parent.profileImage.startsWith('http')
      ? parent.profileImage
      : `${IMAGE_BASE_URL.replace(/\/$/, '')}/${parent.profileImage.replace(/^\//, '')}`
    : null;

  const isArchived = parent.status === 'archived';

  const statusColor =
    isArchived                    ? 'default' :
    parent.status === 'active'    ? 'success' :
    parent.status === 'suspended' ? 'error'   : 'warning';

  const statusLabel = isArchived ? 'Archived' : (parent.status || 'active');

  const relationshipLabel = {
    father:   'Father',
    mother:   'Mother',
    guardian: 'Guardian',
    other:    'Other',
  }[parent.relationship] ?? parent.relationship;

  const languageLabel = {
    en: 'English', fr: 'Français', es: 'Español',
    ar: 'العربية', 'zh-CN': '中文', de: 'Deutsch',
  }[parent.preferredLanguage] ?? parent.preferredLanguage;

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>

      {/* ── Header ────────────────────────────────────────────────────────── */}
      <Box
        sx={{
          p: 3,
          background: 'linear-gradient(135deg, #1a5276 0%, #2e86c1 100%)',
          color: 'white',
          position: 'relative',
        }}
      >
        <IconButton
          onClick={onClose}
          sx={{ position: 'absolute', right: 8, top: 8, color: 'white' }}
          aria-label="close"
        >
          <Close />
        </IconButton>

        <Stack alignItems="center" spacing={2} sx={{ mt: 5 }}>
          <Avatar
            src={profileImageUrl}
            sx={{
              width: 100, height: 100,
              border: '4px solid white',
              boxShadow: 3,
              fontSize: '2rem', fontWeight: 700,
              bgcolor: 'rgba(255,255,255,0.2)',
            }}
          >
            {parent.firstName?.[0]}
            {parent.lastName?.[0]}
          </Avatar>

          <Box textAlign="center">
            <Typography variant="h5" fontWeight={700}>
              {parent.firstName} {parent.lastName}
            </Typography>
            <Typography variant="body2" sx={{ opacity: 0.85, mt: 0.5 }}>
              {parent.email}
            </Typography>
            <Stack direction="row" spacing={1} justifyContent="center" sx={{ mt: 1 }}>
              <Chip
                label={relationshipLabel}
                size="small"
                icon={<FamilyRestroom sx={{ fontSize: 14, color: 'white !important' }} />}
                sx={{
                  bgcolor: 'rgba(255,255,255,0.2)',
                  color: 'white',
                  fontWeight: 600,
                  border: '1px solid rgba(255,255,255,0.4)',
                }}
              />
              {parent.parentRef && (
                <Chip
                  label={parent.parentRef}
                  size="small"
                  sx={{
                    bgcolor: 'rgba(255,255,255,0.15)',
                    color: 'white',
                    border: '1px solid rgba(255,255,255,0.3)',
                    fontFamily: 'monospace',
                  }}
                />
              )}
            </Stack>
          </Box>
        </Stack>
      </Box>

      {/* ── Content ───────────────────────────────────────────────────────── */}
      <Box sx={{ flex: 1, overflow: 'auto', p: 3 }}>
        <Stack spacing={3}>

          {/* Status & Quick Actions */}
          <Paper elevation={2} sx={{ p: 2, borderRadius: 2 }}>
            <Stack direction="row" justifyContent="space-between" alignItems="center">
              <Chip
                label={statusLabel}
                color={statusColor}
                size="small"
                sx={{ fontWeight: 600, textTransform: 'capitalize' }}
              />
              <Stack direction="row" spacing={0.5}>
                {!isArchived && (
                  <IconButton size="small" color="primary" onClick={onEdit} title="Edit Parent">
                    <Edit fontSize="small" />
                  </IconButton>
                )}
                {isArchived ? (
                  onRestore && (
                    <IconButton size="small" color="success" onClick={onRestore} title="Restore Parent">
                      <Restore fontSize="small" />
                    </IconButton>
                  )
                ) : (
                  onArchive && (
                    <IconButton size="small" color="error" onClick={onArchive} title="Archive Parent">
                      <Archive fontSize="small" />
                    </IconButton>
                  )
                )}
              </Stack>
            </Stack>
          </Paper>

          {/* Personal Information */}
          <Box>
            <Typography variant="overline" color="primary" fontWeight={700} fontSize="0.875rem">
              Personal Information
            </Typography>
            <Divider sx={{ mb: 2, mt: 0.5 }} />
            <List disablePadding>
              <DetailItem
                icon={parent.gender === 'male' ? <Male color="action" /> : <Female color="action" />}
                primary="Gender"
                secondary={parent.gender
                  ? parent.gender.charAt(0).toUpperCase() + parent.gender.slice(1)
                  : 'N/A'}
              />
              {parent.dateOfBirth && (
                <DetailItem
                  icon={<Cake color="action" />}
                  primary="Date of Birth"
                  secondary={`${fDate(parent.dateOfBirth)}${age ? ` (${age} years old)` : ''}`}
                />
              )}
              {parent.nationalId && (
                <DetailItem
                  icon={<Badge color="action" />}
                  primary="National ID"
                  secondary={parent.nationalId}
                />
              )}
              {parent.occupation && (
                <DetailItem
                  icon={<Person color="action" />}
                  primary="Occupation"
                  secondary={parent.occupation}
                />
              )}
            </List>
          </Box>

          {/* Contact Information */}
          <Box>
            <Typography variant="overline" color="primary" fontWeight={700} fontSize="0.875rem">
              Contact Information
            </Typography>
            <Divider sx={{ mb: 2, mt: 0.5 }} />
            <List disablePadding>
              <ListItem disablePadding sx={{ py: 1 }}>
                <ListItemIcon sx={{ minWidth: 40 }}><Email color="action" /></ListItemIcon>
                <ListItemText
                  primary="Email"
                  secondary={parent.email || 'N/A'}
                  onClick={() => window.location.href = `mailto:${parent.email}`}
                  slotProps={{
                    primary:   { variant: 'caption', color: 'text.secondary' },
                    secondary: {
                      variant: 'body2', fontWeight: 600,
                      sx: { color: 'primary.main', textDecoration: 'underline', cursor: 'pointer', wordBreak: 'break-word' },
                    },
                  }}
                />
              </ListItem>
              <DetailItem icon={<Phone color="action" />} primary="Phone" secondary={parent.phone || 'N/A'} />
            </List>

            {/* Address sub-section */}
            {parent.address && Object.values(parent.address).some(Boolean) && (
              <Box sx={{ mt: 1, pl: 0.5 }}>
                <Typography variant="caption" color="text.secondary" fontWeight={600}>Address</Typography>
                <Typography variant="body2" sx={{ mt: 0.5 }}>
                  {[
                    parent.address.street,
                    parent.address.city,
                    parent.address.state,
                    parent.address.postalCode,
                    parent.address.country,
                  ].filter(Boolean).join(', ')}
                </Typography>
              </Box>
            )}
          </Box>

          {/* Children */}
          <Box>
            <Typography variant="overline" color="primary" fontWeight={700} fontSize="0.875rem">
              Linked Children
              <Typography component="span" variant="caption" color="text.secondary" sx={{ ml: 1 }}>
                ({parent.children?.length ?? 0} / 10)
              </Typography>
            </Typography>
            <Divider sx={{ mb: 2, mt: 0.5 }} />
            {parent.children?.length > 0 ? (
              <Stack spacing={1}>
                {parent.children.map((child) => (
                  <Paper
                    key={child._id}
                    variant="outlined"
                    sx={{ p: 1.5, borderRadius: 2, display: 'flex', alignItems: 'center', gap: 1.5 }}
                  >
                    <Avatar
                      src={child.profileImage?.startsWith('http') ? child.profileImage : undefined}
                      sx={{ width: 36, height: 36, bgcolor: 'primary.light' }}
                    >
                      {child.firstName?.[0]}
                    </Avatar>
                    <Box flex={1}>
                      <Typography variant="body2" fontWeight={600}>
                        {child.firstName} {child.lastName}
                      </Typography>
                      {child.status && (
                        <Chip
                          label={child.status}
                          size="small"
                          color={child.status === 'active' ? 'success' : 'default'}
                          sx={{ height: 18, fontSize: '0.65rem', mt: 0.25 }}
                        />
                      )}
                    </Box>
                    <ChildCare sx={{ fontSize: 18, color: 'text.secondary' }} />
                  </Paper>
                ))}
              </Stack>
            ) : (
              <Typography variant="body2" color="text.secondary" fontStyle="italic">
                No children linked yet.
              </Typography>
            )}
          </Box>

          {/* Preferences */}
          <Box>
            <Typography variant="overline" color="primary" fontWeight={700} fontSize="0.875rem">
              Preferences
            </Typography>
            <Divider sx={{ mb: 2, mt: 0.5 }} />
            <List disablePadding>
              <DetailItem
                icon={<Language color="action" />}
                primary="Preferred Language"
                secondary={languageLabel || 'N/A'}
              />
              {parent.notificationPrefs && (
                <ListItem disablePadding sx={{ py: 1 }}>
                  <ListItemIcon sx={{ minWidth: 40 }}>
                    <NotificationsActive color="action" />
                  </ListItemIcon>
                  <ListItemText
                    primary="Notifications"
                    slotProps={{ primary: { variant: 'caption', color: 'text.secondary' } }}
                    secondary={
                      <Stack direction="row" spacing={0.5} flexWrap="wrap" component="span">
                        {[['inapp', 'IN-APP'], ['email', 'EMAIL'], ['whatsapp', 'WHATSAPP']].map(([key, lbl]) => (
                          <Chip
                            key={key}
                            label={lbl}
                            size="small"
                            color={parent.notificationPrefs[key] ? 'primary' : 'default'}
                            variant={parent.notificationPrefs[key] ? 'filled' : 'outlined'}
                            sx={{ height: 20, fontSize: '0.65rem' }}
                          />
                        ))}
                      </Stack>
                    }
                  />
                </ListItem>
              )}
            </List>
          </Box>

          {/* Campus */}
          <Box>
            <Typography variant="overline" color="primary" fontWeight={700} fontSize="0.875rem">
              Campus
            </Typography>
            <Divider sx={{ mb: 2, mt: 0.5 }} />
            <List disablePadding>
              <DetailItem
                icon={<Domain color="action" />}
                primary="Campus"
                secondary={parent.schoolCampus?.campus_name || 'N/A'}
              />
            </List>
          </Box>

          {/* Account Info */}
          <Box>
            <Typography variant="overline" color="text.secondary" fontSize="0.75rem">
              Account Information
            </Typography>
            <Divider sx={{ mb: 1, mt: 0.5 }} />
            <Grid container spacing={1}>
              <Grid size={{ xs: 6 }}>
                <Typography variant="caption" color="text.secondary">Created</Typography>
                <Typography variant="body2" fontWeight={500}>{fDate(parent.createdAt)}</Typography>
              </Grid>
              <Grid size={{ xs: 6 }}>
                <Typography variant="caption" color="text.secondary">Last Updated</Typography>
                <Typography variant="body2" fontWeight={500}>{fDate(parent.updatedAt)}</Typography>
              </Grid>
              {parent.lastLogin && (
                <Grid size={{ xs: 12 }}>
                  <Typography variant="caption" color="text.secondary">Last Login</Typography>
                  <Typography variant="body2" fontWeight={500}>{fDate(parent.lastLogin)}</Typography>
                </Grid>
              )}
            </Grid>
          </Box>

        </Stack>
      </Box>

      {/* ── Footer ────────────────────────────────────────────────────────── */}
      <Box sx={{ p: 3, borderTop: 1, borderColor: 'divider' }}>
        <Stack direction="row" spacing={2}>
          <Button variant="outlined" fullWidth onClick={onClose} sx={{ borderRadius: 2 }}>
            Close
          </Button>
          {isArchived ? (
            onRestore && (
              <Button
                variant="contained"
                fullWidth
                color="success"
                startIcon={<Restore />}
                onClick={onRestore}
                sx={{ borderRadius: 2 }}
              >
                Restore Parent
              </Button>
            )
          ) : (
            <Button
              variant="contained"
              fullWidth
              startIcon={<Edit />}
              onClick={onEdit}
              sx={{ borderRadius: 2 }}
            >
              Edit Parent
            </Button>
          )}
        </Stack>
      </Box>

    </Box>
  );
};

export default ParentDetailDrawer;

// ─── Shared sub-component ─────────────────────────────────────────────────────

const DetailItem = ({ icon, primary, secondary }) => (
  <ListItem disablePadding sx={{ py: 1 }}>
    <ListItemIcon sx={{ minWidth: 40 }}>{icon}</ListItemIcon>
    <ListItemText
      primary={primary}
      secondary={secondary}
      slotProps={{
        primary:   { variant: 'caption', color: 'text.secondary' },
        secondary: { variant: 'body2',   fontWeight: 600 },
      }}
    />
  </ListItem>
);
