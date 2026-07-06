/**
 * @file AiFigures.jsx
 * @description Generic renderer for the ERP aggregate `figures` object returned
 * by analytics reports. Figures are computed by the ERP (ADR-4) and vary per
 * report, so this renders them structurally without report-specific knowledge:
 * scalar entries become labelled stat tiles, arrays of flat objects become a
 * compact table. Keys are humanised; the AI narrative carries the meaning.
 */

import {
  Box, Grid, Paper, Typography, Table, TableHead, TableBody, TableRow,
  TableCell, Stack,
} from '@mui/material';

/** camelCase / snake_case → "Title Case". */
const humanize = (key) =>
  String(key)
    .replace(/[_-]/g, ' ')
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/^\w/, (c) => c.toUpperCase());

const isScalar = (v) => v === null || ['string', 'number', 'boolean'].includes(typeof v);

const fmt = (v) => {
  if (v === null || v === undefined) return '—';
  if (typeof v === 'number') return v.toLocaleString();
  if (typeof v === 'boolean') return v ? '✓' : '✗';
  return String(v);
};

function ScalarTile({ label, value }) {
  return (
    <Paper variant="outlined" sx={{ p: 1.5, borderRadius: 2, height: '100%' }}>
      <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
        {humanize(label)}
      </Typography>
      <Typography variant="h6" fontWeight={700}>{fmt(value)}</Typography>
    </Paper>
  );
}

function ArrayTable({ rows }) {
  const columns = Array.from(
    rows.reduce((set, r) => { Object.keys(r).forEach((k) => set.add(k)); return set; }, new Set()),
  );
  return (
    <Box sx={{ overflowX: 'auto' }}>
      <Table size="small">
        <TableHead>
          <TableRow>
            {columns.map((c) => (
              <TableCell key={c} sx={{ fontWeight: 700 }}>{humanize(c)}</TableCell>
            ))}
          </TableRow>
        </TableHead>
        <TableBody>
          {rows.map((r, i) => (
            <TableRow key={i}>
              {columns.map((c) => <TableCell key={c}>{fmt(r[c])}</TableCell>)}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Box>
  );
}

export default function AiFigures({ figures }) {
  if (!figures || typeof figures !== 'object') return null;

  const scalars = [];
  const groups = []; // { label, rows }

  Object.entries(figures).forEach(([key, value]) => {
    if (isScalar(value)) {
      scalars.push({ key, value });
    } else if (Array.isArray(value) && value.every((v) => v && typeof v === 'object')) {
      groups.push({ label: key, rows: value });
    } else if (value && typeof value === 'object') {
      // Nested object → flatten one level into scalar tiles.
      Object.entries(value).forEach(([k, v]) => {
        if (isScalar(v)) scalars.push({ key: `${key} · ${k}`, value: v });
      });
    }
  });

  return (
    <Stack spacing={2}>
      {scalars.length > 0 && (
        <Grid container spacing={1.5}>
          {scalars.map(({ key, value }) => (
            <Grid size={{ xs: 6, sm: 4, md: 3 }} key={key}>
              <ScalarTile label={key} value={value} />
            </Grid>
          ))}
        </Grid>
      )}

      {groups.map(({ label, rows }) => (
        <Paper key={label} variant="outlined" sx={{ p: 1.5, borderRadius: 2 }}>
          <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 1 }}>{humanize(label)}</Typography>
          <ArrayTable rows={rows} />
        </Paper>
      ))}
    </Stack>
  );
}
