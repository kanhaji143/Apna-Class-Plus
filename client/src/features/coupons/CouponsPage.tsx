import { useEffect, useState } from 'react';
import {
  Box, Typography, Card, CardContent, Grid, Button, Chip, IconButton, TextField,
  Dialog, DialogTitle, DialogContent, DialogActions, MenuItem, Select, FormControl, InputLabel, Tooltip,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import { get, post, put, del } from '../../api/client';

interface Coupon {
  _id: number; code: string; discountType: 'percent' | 'flat'; value: number;
  courseId: number | null; courseTitle?: string | null; status: string;
  expiry: string | null; usedCount: number; createdAt?: string;
}
interface Course { id: number; title: string; }

const fmtDate = (v?: string | null) => {
  if (!v) return '';
  const d = new Date(v);
  return isNaN(d.getTime()) ? '' : d.toLocaleDateString('en-IN');
};
const fmtDiscount = (c: Coupon) => (c.discountType === 'flat' ? `₹${c.value} off` : `${c.value}% off`);

/** Teacher-side coupon manager — store enroll par students code use karte hain. */
export default function CouponsPage() {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ code: '', discountType: 'percent', value: '10', courseId: '', expiry: '' });
  const [busy, setBusy] = useState(false);

  const load = () => {
    get<Coupon[]>('/v1/diy/coupons').then(setCoupons).catch(() => setCoupons([])).finally(() => setLoading(false));
    get<{ data: Course[] }>('/v2/courses').then((d) => setCourses(d.data || [])).catch(() => setCourses([]));
  };

  useEffect(load, []);

  const create = async () => {
    if (!form.code.trim() || !Number(form.value)) return;
    setBusy(true);
    try {
      await post('/v1/diy/coupons', {
        code: form.code.trim(),
        discountType: form.discountType,
        value: Number(form.value),
        courseId: form.courseId ? Number(form.courseId) : null,
        courseTitle: courses.find((c) => c.id === Number(form.courseId))?.title || null,
        expiry: form.expiry || null,
      });
      setOpen(false);
      setForm({ code: '', discountType: 'percent', value: '10', courseId: '', expiry: '' });
      load();
    } finally { setBusy(false); }
  };

  const toggle = async (c: Coupon) => {
    await put(`/v1/diy/coupons/${c._id}`, { status: c.status === 'active' ? 'disabled' : 'active' });
    load();
  };

  const remove = async (c: Coupon) => {
    if (!window.confirm(`Coupon ${c.code} delete karna hai?`)) return;
    await del(`/v1/diy/coupons/${c._id}`);
    load();
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3, flexWrap: 'wrap' }}>
        <Box sx={{ flexGrow: 1 }}>
          <Typography variant="h5" fontWeight={900}>Coupons</Typography>
          <Typography variant="body2" color="text.secondary">
            Discount codes banao — student store enroll par code daalke discounted price dekhega.
          </Typography>
        </Box>
        <Button variant="contained" startIcon={<AddIcon />} onClick={() => setOpen(true)}>Create Coupon</Button>
      </Box>

      {loading ? (
        <Typography color="text.secondary">Loading coupons…</Typography>
      ) : coupons.length === 0 ? (
        <Card><CardContent>
          <Typography variant="h6">Koi coupon nahi</Typography>
          <Typography variant="body2" color="text.secondary">
            "Create Coupon" se pehla coupon banao — code, discount (percent/flat), course (optional) aur expiry.
          </Typography>
        </CardContent></Card>
      ) : (
        <Grid container spacing={2}>
          {coupons.map((c) => (
            <Grid item xs={12} sm={6} md={4} key={c._id}>
              <Card elevation={2}>
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                    <Typography fontWeight={900} sx={{ letterSpacing: 0.5 }}>{c.code}</Typography>
                    <Chip size="small" label={c.status} color={c.status === 'active' ? 'success' : 'default'} />
                  </Box>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                    {fmtDiscount(c)} · {c.courseTitle || 'All courses'}
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                    <Chip size="small" variant="outlined" label={`Used ${c.usedCount}x`} />
                    {c.expiry && <Chip size="small" variant="outlined" label={`Exp ${fmtDate(c.expiry)}`} />}
                  </Box>
                  <Box sx={{ mt: 1.5, display: 'flex', gap: 1 }}>
                    <Button size="small" variant="outlined" onClick={() => toggle(c)}>
                      {c.status === 'active' ? 'Disable' : 'Enable'}
                    </Button>
                    <Tooltip title="Delete coupon">
                      <IconButton size="small" color="error" onClick={() => remove(c)}><DeleteIcon fontSize="small" /></IconButton>
                    </Tooltip>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Create Coupon</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 2 }}>
          <TextField label="Code" value={form.code} placeholder="DIWALI20" onChange={(e) => setForm({ ...form, code: e.target.value })} fullWidth autoFocus />
          <FormControl fullWidth>
            <InputLabel>Discount Type</InputLabel>
            <Select label="Discount Type" value={form.discountType} onChange={(e) => setForm({ ...form, discountType: e.target.value })}>
              <MenuItem value="percent">Percent (%)</MenuItem>
              <MenuItem value="flat">Flat (₹)</MenuItem>
            </Select>
          </FormControl>
          <TextField
            label={form.discountType === 'flat' ? 'Discount (₹)' : 'Discount (%)'}
            type="number" value={form.value} onChange={(e) => setForm({ ...form, value: e.target.value })} fullWidth
          />
          <FormControl fullWidth>
            <InputLabel>Course</InputLabel>
            <Select label="Course" value={form.courseId} onChange={(e) => setForm({ ...form, courseId: e.target.value })}>
              <MenuItem value="">All courses</MenuItem>
              {courses.map((c) => <MenuItem key={c.id} value={String(c.id)}>{c.title}</MenuItem>)}
            </Select>
          </FormControl>
          <TextField label="Expiry (optional)" type="date" value={form.expiry} onChange={(e) => setForm({ ...form, expiry: e.target.value })} fullWidth />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>Cancel</Button>
          <Button variant="contained" disabled={!form.code.trim() || !Number(form.value) || busy} onClick={create}>
            {busy ? 'Creating…' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
