import { useEffect, useState } from 'react';
import {
  Box, Typography, Card, CardContent, Grid, Button, Chip, IconButton, TextField,
  Dialog, DialogTitle, DialogContent, DialogActions, MenuItem, Select, FormControl, InputLabel, Tooltip,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import { get, post, put, del } from '../../api/client';

interface Referral {
  _id: number; code: string; discountType: 'percent' | 'flat'; value: number;
  status: string; expiry: string | null; usedCount: number; referrerName?: string; rewardAmount?: number; createdAt?: string;
}

const fmtDate = (v?: string | null) => {
  if (!v) return '';
  const d = new Date(v);
  return isNaN(d.getTime()) ? '' : d.toLocaleDateString('en-IN');
};

/** Referral codes — students invite friends; usage tracked. */
export default function ReferralsPage() {
  const [items, setItems] = useState<Referral[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ code: '', discountType: 'percent', value: '10', referrerName: '', expiry: '', rewardAmount: '0' });
  const [busy, setBusy] = useState(false);

  const load = () => {
    get<Referral[]>('/v1/diy/referrals').then(setItems).catch(() => setItems([])).finally(() => setLoading(false));
  };
  useEffect(load, []);

  const create = async () => {
    if (!form.code.trim() || !Number(form.value)) return;
    setBusy(true);
    try {
      await post('/v1/diy/referrals', { code: form.code.trim(), discountType: form.discountType, value: Number(form.value), referrerName: form.referrerName || undefined, rewardAmount: Number(form.rewardAmount || 0), expiry: form.expiry || null });
      setOpen(false);
      setForm({ code: '', discountType: 'percent', value: '10', referrerName: '', expiry: '', rewardAmount: '0' });
      load();
    } finally { setBusy(false); }
  };

  const toggle = async (c: Referral) => {
    await put(`/v1/diy/referrals/${c._id}`, { status: c.status === 'active' ? 'disabled' : 'active' });
    load();
  };

  const remove = async (c: Referral) => {
    if (!window.confirm(`Referral ${c.code} delete karna hai?`)) return;
    await del(`/v1/diy/referrals/${c._id}`);
    load();
  };

  const fmtDiscount = (c: Referral) => (c.discountType === 'flat' ? `₹${c.value} off` : `${c.value}% off`);

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3, flexWrap: 'wrap' }}>
        <Box sx={{ flexGrow: 1 }}>
          <Typography variant="h5" fontWeight={900}>Referrals</Typography>
          <Typography variant="body2" color="text.secondary">
            Referral codes banao — students apne dost ko bheje, dono ko discount mile.
          </Typography>
        </Box>
        <Button variant="contained" startIcon={<AddIcon />} onClick={() => setOpen(true)}>Create Referral</Button>
      </Box>

      {loading ? (
        <Typography color="text.secondary">Loading…</Typography>
      ) : items.length === 0 ? (
        <Card><CardContent>
          <Typography variant="h6">Koi referral code nahi</Typography>
          <Typography variant="body2" color="text.secondary">"Create Referral" se pehla code banao.</Typography>
        </CardContent></Card>
      ) : (
        <Grid container spacing={2}>
          {items.map((c) => (
            <Grid item xs={12} sm={6} md={4} key={c._id}>
              <Card elevation={2}>
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                    <Typography fontWeight={900} sx={{ letterSpacing: 0.5 }}>{c.code}</Typography>
                    <Chip size="small" label={c.status} color={c.status === 'active' ? 'success' : 'default'} />
                  </Box>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                    {fmtDiscount(c)} {c.referrerName ? `· Referrer: ${c.referrerName}` : ''}
                    {c.rewardAmount ? ` · Reward: ₹${c.rewardAmount}/use · Total ₹${(c.rewardAmount || 0) * (c.usedCount || 0)}` : ''}
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                    <Chip size="small" variant="outlined" label={`Used ${c.usedCount}x`} />
                    {c.expiry && <Chip size="small" variant="outlined" label={`Exp ${fmtDate(c.expiry)}`} />}
                  </Box>
                  <Box sx={{ mt: 1.5, display: 'flex', gap: 1 }}>
                    <Button size="small" variant="outlined" onClick={() => toggle(c)}>
                      {c.status === 'active' ? 'Disable' : 'Enable'}
                    </Button>
                    <Tooltip title="Delete">
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
        <DialogTitle>Create Referral Code</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 2 }}>
          <TextField label="Code" value={form.code} placeholder="FRIEND20" onChange={(e) => setForm({ ...form, code: e.target.value })} fullWidth autoFocus />
          <FormControl fullWidth>
            <InputLabel>Discount Type</InputLabel>
            <Select label="Discount Type" value={form.discountType} onChange={(e) => setForm({ ...form, discountType: e.target.value })}>
              <MenuItem value="percent">Percent (%)</MenuItem>
              <MenuItem value="flat">Flat (₹)</MenuItem>
            </Select>
          </FormControl>
          <TextField label={form.discountType === 'flat' ? 'Discount (₹)' : 'Discount (%)'} type="number" value={form.value} onChange={(e) => setForm({ ...form, value: e.target.value })} fullWidth />
          <TextField label="Referrer name (optional)" value={form.referrerName} onChange={(e) => setForm({ ...form, referrerName: e.target.value })} fullWidth />
          <TextField label="Reward per use (₹, optional)" type="number" value={form.rewardAmount} onChange={(e) => setForm({ ...form, rewardAmount: e.target.value })} fullWidth />
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
