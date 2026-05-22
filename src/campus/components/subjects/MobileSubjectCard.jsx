import React, { useState } from 'react';
import {
  Box,
  Button,
  Typography,
  Stack,
  Divider,
  Chip,
  Card,
  CardContent,
  Grid,
} from '@mui/material';

import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  Restore as RestoreIcon,
  Book as BookIcon,
} from '@mui/icons-material';


const MobileSubjectCard = ({ subject, edit, archive, restore }) => (
  
  <Card
  sx={{
    mb: 2,
    borderRadius: 3,
    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
    '&:hover': {
      boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
    },
  }}
>
  <CardContent>
    <Stack spacing={2}>
      {/* Subject Name & Status */}
      <Box display="flex" justifyContent="space-between" alignItems="center">
        <Stack direction="row" spacing={1} alignItems="center">
          <BookIcon color="primary" fontSize="small" />
          <Typography variant="h6" fontWeight={600}>
            {subject.subject_name}
          </Typography>
        </Stack>
        <Chip
          label={subject.status !== 'archived' ? 'Active' : 'Archived'}
          color={subject.status !== 'archived' ? 'success' : 'default'}
          size="small"
        />
      </Box>

      <Divider />

      {/* Details */}
      <Grid container spacing={2}>
        <Grid size={6}>
          <Typography variant="caption" color="text.secondary">
            Code
          </Typography>
          <Chip label={subject.subject_code} size="small" sx={{ mt: 0.5 }} />
        </Grid>

        <Grid size={6}>
          <Typography variant="caption" color="text.secondary">
            Campus
          </Typography>
          <Typography variant="body2" fontWeight={500}>
            {subject.schoolCampus?.campus_name || '—'}
          </Typography>
        </Grid>

        <Grid size={6}>
          <Typography variant="caption" color="text.secondary">
            Coefficient
          </Typography>
          <Typography variant="body2" fontWeight={500}>
            {subject.coefficient}
          </Typography>
        </Grid>

        {subject.color && (
          <Grid size={6}>
            <Typography variant="caption" color="text.secondary">
              Color
            </Typography>
            <Box
              sx={{
                width: 40,
                height: 20,
                bgcolor: subject.color,
                border: '1px solid #ddd',
                borderRadius: 1,
                mt: 0.5,
              }}
            />
          </Grid>
        )}
      </Grid>

      {/* Actions */}
      <Stack direction="row" spacing={1} justifyContent="flex-end">
        <Button
          size="small"
          variant="outlined"
          startIcon={<EditIcon />}
          onClick={() => edit(subject)}
        >
          Edit
        </Button>
        {subject.status !== 'archived' ? (
          <Button
            size="small"
            variant="outlined"
            color="error"
            startIcon={<DeleteIcon />}
            onClick={() => archive(subject._id, subject.subject_name)}
          >
            Archive
          </Button>
        ) : (
          <Button
            size="small"
            variant="outlined"
            color="success"
            startIcon={<RestoreIcon />}
            onClick={() => restore(subject._id, subject.subject_name)}
          >
            Restore
          </Button>
        )}
      </Stack>
    </Stack>
  </CardContent>
</Card>
);

export default MobileSubjectCard;