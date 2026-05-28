/**
 * @file MentorCourses.jsx
 * @description Read-only course catalogue for the mentor's campus.
 */

import { useState, useEffect, useCallback } from 'react';
import {
  Box, Typography, Paper, Stack, Chip, Grid,
  TextField, InputAdornment, Alert, Pagination,
  Card, CardContent, Skeleton,
} from '@mui/material';
import { Search, MenuBook, Person } from '@mui/icons-material';

import { getMyCourses } from '../../../services/mentorService';

const MENTOR_PRIMARY  = '#003285';
const MENTOR_GRADIENT = 'linear-gradient(135deg, #003285 0%, #4989c8 100%)';

export default function MentorCourses() {
  const [courses, setCourses] = useState([]);
  const [total,   setTotal]   = useState(0);
  const [page,    setPage]    = useState(1);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(null);
  const [search,  setSearch]  = useState('');

  const LIMIT = 12;

  const fetchCourses = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getMyCourses({ page, limit: LIMIT, search: search || undefined });
      setCourses(res.data?.data ?? []);
      setTotal(res.data?.pagination?.total ?? 0);
    } catch {
      setError('Failed to load courses.');
    } finally {
      setLoading(false);
    }
  }, [page, search]);

  useEffect(() => { fetchCourses(); }, [fetchCourses]);

  const totalPages = Math.ceil(total / LIMIT);

  return (
    <Box sx={{ p: { xs: 2, md: 3 }, maxWidth: 1100, mx: 'auto' }}>

      <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 3 }}>
        <MenuBook sx={{ color: MENTOR_PRIMARY, fontSize: 28 }} />
        <Box>
          <Typography variant="h5" fontWeight={800}>Courses</Typography>
          <Typography variant="body2" color="text.secondary">
            Published courses on your campus (read-only)
          </Typography>
        </Box>
      </Stack>

      <TextField
        size="small"
        fullWidth
        placeholder="Search title, code…"
        value={search}
        onChange={(e) => { setSearch(e.target.value); setPage(1); }}
        sx={{ mb: 2.5, '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
        slotProps={{
          input: { startAdornment: <InputAdornment position="start"><Search fontSize="small" /></InputAdornment> },
        }}
      />

      {error && <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>{error}</Alert>}

      {loading ? (
        <Grid container spacing={2}>
          {Array.from({ length: 6 }).map((_, i) => (
            <Grid item xs={12} sm={6} md={4} key={i}>
              <Skeleton variant="rectangular" height={140} sx={{ borderRadius: 3 }} />
            </Grid>
          ))}
        </Grid>
      ) : courses.length === 0 ? (
        <Paper variant="outlined" sx={{ p: 4, borderRadius: 3, textAlign: 'center' }}>
          <Typography color="text.secondary">No courses found.</Typography>
        </Paper>
      ) : (
        <Grid container spacing={2}>
          {courses.map((c) => (
            <Grid item xs={12} sm={6} md={4} key={c._id}>
              <Card
                variant="outlined"
                sx={{
                  borderRadius: 3, height: '100%',
                  transition: 'box-shadow 0.2s',
                  '&:hover': { boxShadow: 4 },
                }}
              >
                <Box sx={{ height: 6, background: MENTOR_GRADIENT, borderRadius: '12px 12px 0 0' }} />
                <CardContent sx={{ p: 2.5 }}>
                  <Stack direction="row" justifyContent="space-between" alignItems="flex-start" sx={{ mb: 1 }}>
                    <Typography variant="subtitle2" fontWeight={700} sx={{ lineHeight: 1.3, flex: 1, pr: 1 }}>
                      {c.title}
                    </Typography>
                    {c.courseCode && (
                      <Chip
                        label={c.courseCode}
                        size="small"
                        sx={{ fontFamily: 'monospace', fontWeight: 700, bgcolor: '#f0f4ff', color: MENTOR_PRIMARY }}
                      />
                    )}
                  </Stack>

                  {c.subject?.subject_name && (
                    <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 1 }}>
                      {c.subject.subject_name}
                    </Typography>
                  )}

                  {c.description && (
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden',
                        mb: 1.5,
                      }}
                    >
                      {c.description}
                    </Typography>
                  )}

                  {c.createdBy && (
                    <Stack direction="row" spacing={0.5} alignItems="center">
                      <Person sx={{ fontSize: 14, color: 'text.secondary' }} />
                      <Typography variant="caption" color="text.secondary">
                        {c.createdBy.firstName} {c.createdBy.lastName}
                      </Typography>
                    </Stack>
                  )}
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      {totalPages > 1 && (
        <Stack alignItems="center" sx={{ mt: 3 }}>
          <Pagination
            count={totalPages}
            page={page}
            onChange={(_, v) => setPage(v)}
            color="primary"
            shape="rounded"
          />
        </Stack>
      )}
    </Box>
  );
}
