import { useEffect, useState } from 'react';
import {
  Box, Button, Card, CardContent, Typography, Chip, IconButton, TextField,
  Dialog, DialogTitle, DialogContent, DialogActions, MenuItem, Select, FormControl, InputLabel, Grid,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import SendIcon from '@mui/icons-material/Send';
import DeleteIcon from '@mui/icons-material/Delete';
import { get, post, del } from '../../api/client';

interface Campaign { _id: number; name: string; channel: string; audience: any; audienceLabel?: string; message: string; status: string; sentCount: number; createdAt: string; publishedAt?: string | null; }
interface Course { id: number; title: string; }
interface Batch { id: number; name: string; courseTitle?: string; }

const fmtDate = (v?: string | null) => {
  if (!v) return '';
  const d = new Date(v);
  return isNaN(d.getTime()) ? '' : d.toLocaleDateString('en-IN');
};

const audienceText = (c: Campaign) => {
  if (c.audienceLabel) return c.audienceLabel;
  const t = c.audience?.type;
  if (t === 'leads') return 'Leads only';
  if (t === 'students') return 'Students only';
  if (t === 'course') return 'Course students';
  if (t === 'batch') return 'Batch students';
  return 'All (Students + Leads)';
};

export default function CampaignsListPage() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [batches, setBatches] = useState<Batch[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: '', channel: 'SMS', audienceType: 'all', audienceId: '', message: '' });
  const [creating, setCreating] = useState(false);
  const [publishing, setPublishing] = useState<number | null>(null);

  const load = () => {
    get<Campaign[]>('/v1/diy/campaignList').then(setCampaigns).catch(() => setCampaigns([])).finally(() => setLoading(false));
  };

  const loadTargets = () => {
    get<{ data: Course[] }>('/v2/courses')
      .then((d) => setCourses(Array.isArray(d?.data) ? d.data : []))
      .catch(() => setCourses([]));
    get<Batch[]>('/v2/batches').then((b) => setBatches(Array.isArray(b) ? b : [])).catch(() => setBatches([]));
  };

  useEffect(() => { load(); loadTargets(); }, []);

  const create = async () => {
    setCreating(true);
    try {
      const audience: any = { type: form.audienceType };
      if (form.audienceType === 'course' || form.audienceType === 'batch') audience.id = Number(form.audienceId);
      await post('/v1/diy/campaign', { name: form.name, channel: form.channel, audience, message: form.message });
      setOpen(false); setForm({ name: '', channel: 'SMS', audienceType: 'all', audienceId: '', message: '' });
      load();
    } finally { setCreating(false); }
  };

  const publish = async (id: number) => {
    if (!window.confirm('Campaign publish karna hai? (Mock send — real gateway nahi)')) return;
    setPublishing(id);
    try {
      const res = await post<{ sentCount: number }>('/v1/diy/campaign/publish', { id });
      window.alert(`✅ Published! ${res.sentCount} recipients ko bheja (mock).`);
      load();
    } finally { setPublishing(null); }
  };

  const remove = async (id: number) => {
    if (!window.confirm('Campaign delete karna hai?')) return;
    await del(`/v1/diy/campaign/${id}`);
    load();
  };

  const needsTarget = form.audienceType === 'course' || form.audienceType === 'batch';

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
            "Create Campaign" se pehla campaign banao — audience chuno (leads/students/course/batch), message likho, publish karo.
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
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                    {c.channel} · {c.sentCount} sent
                  </Typography>
                  <Typography variant="caption" color="primary" sx={{ display: 'block', mb: 1 }}>
                    {audienceText(c)}
                  </Typography>
                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
                    {c.message?.slice(0, 60)}
                  </Typography>
                  {c.status === 'published' && c.publishedAt ? (
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
                      Published {fmtDate(c.publishedAt)}
                    </Typography>
                  ) : null}
                  <Box sx={{ mt: 1, display: 'flex', gap: 1 }}>
                    {c.status !== 'published' && (
                      <Button
                        size="small" variant="contained" startIcon={<SendIcon />}
                        disabled={publishing === c._id}
                        onClick={() => publish(c._id)}
                      >
                        {publishing === c._id ? 'Sending…' : 'Publish'}
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
            <Select
              label="Audience" value={form.audienceType}
              onChange={(e) => setForm({ ...form, audienceType: e.target.value, audienceId: '' })}
            >
              <MenuItem value="all">All (Students + Leads)</MenuItem>
              <MenuItem value="leads">Leads only</MenuItem>
              <MenuItem value="students">Students only</MenuItem>
              <MenuItem value="course">Course students</MenuItem>
              <MenuItem value="batch">Batch students</MenuItem>
            </Select>
          </FormControl>
          {form.audienceType === 'course' && (
            <FormControl fullWidth>
              <InputLabel>Course</InputLabel>
              <Select label="Course" value={form.audienceId} onChange={(e) => setForm({ ...form, audienceId: e.target.value })}>
                {courses.map((c) => <MenuItem key={c.id} value={String(c.id)}>{c.title}</MenuItem>)}
                {courses.length === 0 && <MenuItem value="" disabled>Koi course nahi — pehle course banao</MenuItem>}
              </Select>
            </FormControl>
          )}
          {form.audienceType === 'batch' && (
            <FormControl fullWidth>
              <InputLabel>Batch</InputLabel>
              <Select label="Batch" value={form.audienceId} onChange={(e) => setForm({ ...form, audienceId: e.target.value })}>
                {batches.map((b) => (
                  <MenuItem key={b.id} value={String(b.id)}>
                    {b.name}{b.courseTitle ? ` · ${b.courseTitle}` : ''}
                  </MenuItem>
                ))}
                {batches.length === 0 && <MenuItem value="" disabled>Koi batch nahi — pehle batch banao</MenuItem>}
              </Select>
            </FormControl>
          )}
          <TextField
            label="Message" multiline rows={3} value={form.message}
            onChange={(e) => setForm({ ...form, message: e.target.value })}
            placeholder="Namaste! Aapke liye naya batch shuru ho raha hai…"
            fullWidth
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>Cancel</Button>
          <Button variant="contained" disabled={!form.name || (needsTarget && !form.audienceId) || creating} onClick={create}>
            {creating ? 'Creating…' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
