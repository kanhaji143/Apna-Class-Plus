import { useEffect, useState } from 'react';
import {
  Box, Button, Card, CardContent, Typography, Chip, IconButton, TextField,
  Dialog, DialogTitle, DialogContent, DialogActions, MenuItem, Select, FormControl, InputLabel, Grid,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import SendIcon from '@mui/icons-material/Send';
import DeleteIcon from '@mui/icons-material/Delete';
import { get, post, del } from '../../api/client';

interface Campaign { _id: number; name: string; channel: string; audience: any; message: string; status: string; sentCount: number; createdAt: string; publishedAt: string; }

export default function CampaignsListPage() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: '', channel: 'SMS', audienceType: 'all', audienceId: '', message: '' });
  const [creating, setCreating] = useState(false);

  const load = () => {
    get<Campaign[]>('/v1/diy/campaignList').then(setCampaigns).catch(() => setCampaigns([])).finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const create = async () => {
    setCreating(true);
    try {
      const audience: any = { type: form.audienceType };
      if (form.audienceType !== 'all' && form.audienceType !== 'leads') audience.id = Number(form.audienceId);
      await post('/v1/diy/campaign', { name: form.name, channel: form.channel, audience, message: form.message });
      setOpen(false); setForm({ name: '', channel: 'SMS', audienceType: 'all', audienceId: '', message: '' });
      load();
    } finally { setCreating(false); }
  };

  const publish = async (id: number) => {
    if (!confirm('Campaign publish karna hai? (Mock send — real gateway nahi)')) return;
    const res = await post<{ sentCount: number }>(`/v1/diy/campaign/publish`, { id });
    alert(`✅ Published! ${res.sentCount} recipients ko bheja (mock).`);
    load();
  };

  const remove = async (id: number) => {
    if (!confirm('Campaign delete karna hai?')) return;
    await del(`/v1/diy/campaign/${id}`);
    load();
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap' }}>
        <Button variant="contained" startIcon={<AddIcon />} onClick={() => setOpen(true)}>
          Create Campaign
        </Button>
      </Box>

      {loading ? (
        <Typography color="text.secondary">Loading campaigns…</Typography>
      ) : campaigns.length === 0 ? (
        <Card><CardContent>
          <Typography variant="h6">Koi campaign nahi hai</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            "Create Campaign" se pehla campaign banao.
          </Typography>
        </CardContent></Card>
      ) : (
        <Grid container spacing={2}>
          {campaigns.map((c) => (
            <Grid item xs={12} sm={6} md={4} key={c._id}>
              <Card elevation={3}>
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                    <Typography variant="h6" noWrap sx={{ maxWidth: 200 }}>{c.name}</Typography>
                    <Chip size="small" label={c.status} color={c.status === 'published' ? 'success' : 'default'} />
                  </Box>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                    {c.channel} · {c.sentCount} sent
                  </Typography>
                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
                    {c.message?.slice(0, 60)}
                  </Typography>
                  <Box sx={{ mt: 1, display: 'flex', gap: 1 }}>
                    {c.status !== 'published' && (
                      <Button size="small" variant="contained" startIcon={<SendIcon />} onClick={() => publish(c._id)}>
                        Publish
                      </Button>
                    )}
                    <IconButton size="small" onClick={() => remove(c._id)}>
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Create Campaign</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 2 }}>
          <TextField label="Campaign Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} fullWidth />
          <FormControl fullWidth>
            <InputLabel>Channel</InputLabel>
            <Select label="Channel" value={form.channel} onChange={(e) => setForm({ ...form, channel: e.target.value })}>
              <MenuItem value="SMS">SMS</MenuItem>
              <MenuItem value="Email">Email</MenuItem>
              <MenuItem value="WhatsApp">WhatsApp</MenuItem>
            </Select>
          </FormControl>
          <FormControl fullWidth>
            <InputLabel>Audience</InputLabel>
            <Select label="Audience" value={form.audienceType} onChange={(e) => setForm({ ...form, audienceType: e.target.value })}>
              <MenuItem value="all">All (Students + Leads)</MenuItem>
              <MenuItem value="leads">Leads only</MenuItem>
              <MenuItem value="course">Course students</MenuItem>
              <MenuItem value="batch">Batch students</MenuItem>
            </Select>
          </FormControl>
          {(form.audienceType === 'course' || form.audienceType === 'batch') && (
            <TextField label="Course/Batch ID" type="number" value={form.audienceId} onChange={(e) => setForm({ ...form, audienceId: e.target.value })} fullWidth />
          )}
          <TextField label="Message" multiline rows={3} value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} fullWidth />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>Cancel</Button>
          <Button variant="contained" disabled={!form.name || creating} onClick={create}>
            {creating ? 'Creating…' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
