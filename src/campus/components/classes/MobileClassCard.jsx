import React from 'react';
import {
  Box,
  Button,
  Typography,
  Chip,
  Stack,
  Divider,
  Card,
  CardContent,
  Grid,
} from '@mui/material';

import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  School as SchoolIcon,
  Groups as GroupsIcon,
  Restore as RestoreIcon,
} from '@mui/icons-material';

import HardDeleteAction from '../../../components/shared/HardDeleteAction';

/**
 * @param {Function|null} [onHardDelete] - Permanent-deletion trigger, or null when the operator
 *                                         may not run one on this row (see `useHardDelete`).
 */
const MobileClassCard = ({ cls, edit, archive, restore, onHardDelete = null }) => (
  <Card 
    sx={{ 
      mb: 2, 
      borderRadius: 3,
      boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
      '&:hover': {
        boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
      }
    }}
  >
    <CardContent>
      <Stack spacing={2}>
        {/* Class Name */}
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Stack direction="row" spacing={1} alignItems="center">
            <SchoolIcon color="primary" fontSize="small" />
            <Typography variant="h6" fontWeight={600}>
              {cls.className || '—'}
            </Typography>
          </Stack>
          <Chip
            label={cls.status || 'active'}
            color={cls.status === 'active' ? 'success' : 'default'}
            size="small"
            sx={{ textTransform: 'capitalize' }}
          />
        </Box>

        <Divider />

        {/* Details */}
        <Grid container spacing={2}>
          <Grid size={6}>
            <Typography variant="caption" color="text.secondary">
              Campus
            </Typography>
            <Typography variant="body2" fontWeight={500}>
              {cls.schoolCampus?.campus_name || 'N/A'}
            </Typography>
          </Grid>

          <Grid size={6}>
            <Typography variant="caption" color="text.secondary">
              Level
            </Typography>
            <Typography variant="body2" fontWeight={500}>
              {cls.level?.name || '—'}
            </Typography>
          </Grid>

          <Grid size={6}>
            <Typography variant="caption" color="text.secondary">
              Capacity
            </Typography>
            <Stack direction="row" spacing={0.5} alignItems="center">
              <GroupsIcon fontSize="small" color="disabled" />
              <Typography variant="body2" fontWeight={500}>
                {cls.maxStudents || 0} students
              </Typography>
            </Stack>
          </Grid>
        </Grid>

        {/* Actions */}
        <Stack direction="row" spacing={1} justifyContent="flex-end">
          <Button
            size="small"
            variant="outlined"
            startIcon={<EditIcon />}
            onClick={() => edit(cls)}
          >
            Edit
          </Button>
          {cls.status === 'active' ? (
            <Button
              size="small"
              variant="outlined"
              color="error"
              startIcon={<DeleteIcon />}
              onClick={() => archive(cls._id)}
            >
              Archive
            </Button>
          ) : (
            <Button
              size="small"
              variant="outlined"
              color="success"
              startIcon={<RestoreIcon />}
              onClick={() => restore(cls._id)}
            >
              Restore
            </Button>
          )}

          <HardDeleteAction onHardDelete={onHardDelete} />
        </Stack>
      </Stack>
    </CardContent>
  </Card>
);

export default MobileClassCard;