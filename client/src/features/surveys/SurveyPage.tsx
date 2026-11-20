import { useEffect, useState } from 'react';
import {
  Box, Typography, Card, CardContent, Button, TextField, Chip, IconButton, Tooltip, Dialog, DialogTitle, DialogContent, DialogActions, LinearProgress, FormControl, InputLabel, Select, MenuItem,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import { get, post, del } from '../../api/client';

interface Survey { _id: number; title: string; question: string; options: string[]; status: string; responseCount: number; createdAt?: string; }

const fmtDate = (v: any) => {
  if (!v) return '';
  const d = v?.toDate ? v.toDate() : new Date(v);
  return isNaN(d.getTime()) ? '' : d.toLocaleDateString('en-IN');
};

export default function SurveyPage() {
  const [surveys, setSurveys] = useState<Survey[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ title: '', question: '', options: '', status: 'active' });
  const [busy, setBusy] = useState(false);
  const [viewId, setViewId] = useState<number | null>(null);
  const [responses, setResponses] = useState<any[]>([]);

  const load = () => {
    get<Survey[]>('/v1/diy/surveys').then(setSurveys).catch(() => setSurveys([])).finally(() => setLoading(false));
  };
  useEffect(load, []);

  const save = async () => {
    if (!form.title.trim() || !form.question.trim()) return;
    const opts = form.options.split(',').map((s) => s.trim()).filter(Boolean);
    if (opts.length < 2) { window.alert('Kam se kam 2 options chahiye (comma separated).'); return; }
    setBusy(true);
    try {
      await post('/v1/diy/surveys', { title: form.title, question: form.question, options: opts, status: form.status });
      setOpen(false);
      setForm({ title: '', question: '', options: '', status: 'active' });
      load();
    } finally { setBusy(false); }
  };

  const remove = async (id: number) => {
    if (!window.confirm('Survey delete karna hai?')) return;
    await del(`/v1/diy/surveys/${id}`);
    load();
  };

  const openResponses = async (id: number) => {
    const r = await get<any[]>(`/v1/diy/surveys/${id}/responses`).catch(() => []);
    setResponses(r || []);
    setViewId(id);
  };

  const survey = surveys.find((s) => s._id === viewId);
  const counts = survey ? survey.options.map((o) => ({ opt: o, n: responses.filter((r) => r.answer === o).length })) : [];
  const total = responses.length;

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3, flexWrap: 'wrap' }}>
        <Box sx={{ flexGrow: 1 }}>
          <Typography variant="h5" fontWeight={900}>Surveys</Typography>
          <Typography variant="body2" color="text.secondary">
            Student se feedback / opinion lo — public link se responses aayenge.
          </Typography>
        </Box>
        <Button variant="contained" startIcon={<AddIcon />} onClick={() => setOpen(true)}>New Survey</Button>
      </Box>

      {loading ? (
        <Typography color="text.secondary">Loading…</Typography>
      ) : surveys.length === 0 ? (
        <Card><CardContent>
          <Typography variant="h6">Koi survey nahi</Typography>
          <Typography variant="body2" color="text.secondary">"New Survey" se pehla survey banao.</Typography>
        </CardContent></Card>
      ) : (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {surveys.map((s) => (
            <Card key={s._id} elevation={2}>
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', gap: 1 }}>
                  <Typography fontWeight={800}>{s.title}</Typography>
                  <Chip size="small" label={s.status} color={s.status === 'active' ? 'success' : 'default'} />
                </Box>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>{s.question}</Typography>
                <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 0.5 }}>
                  {fmtDate(s.createdAt)} · {s.responseCount} responses
                </Typography>
                <Box sx={{ mt: 1, display: 'flex', gap: 1 }}>
                  <Button size="small" variant="outlined" onClick={() => openResponses(s._id)}>View Results</Button>
                  <Button size="small" variant="outlined" onClick={() => { navigator.clipboard.writeText(`${location.origin}/survey/${s._id}`); window.alert('Link:\n' + `${location.origin}/survey/${s._id}`); }}>
                    Copy Link
                  </Button>
                  <Tooltip title="Delete"><IconButton size="small" color="error" onClick={() => remove(s._id)}><DeleteIcon fontSize="small" /></IconButton></Tooltip>
                </Box>
              </CardContent>
            </Card>
          ))}
        </Box>
      )}

      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>New Survey</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 2 }}>
          <TextField label="Title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} fullWidth autoFocus />
          <TextField label="Question" multiline rows={2} value={form.question} onChange={(e) => setForm({ ...form, question: e.target.value })} fullWidth />
          <TextField label="Options (comma separated)" value={form.options} onChange={(e) => setForm({ ...form, options: e.target.value })} fullWidth placeholder="Haan, Nahi, Shayad" helperText="Kam se kam 2 options" />
          <FormControl fullWidth>
            <InputLabel>Status</InputLabel>
            <Select label="Status" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
              <MenuItem value="active">Active (public)</MenuItem>
              <MenuItem value="draft">Draft (hidden)</MenuItem>
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>Cancel</Button>
          <Button variant="contained" disabled={!form.title.trim() || !form.question.trim() || busy} onClick={save}>
            {busy ? 'Saving…' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={viewId !== null} onClose={() => setViewId(null)} maxWidth="sm" fullWidth>
        <DialogTitle>{survey?.title} — Results</DialogTitle>
        <DialogContent>
          {survey && (
            <Box>
              <Typography variant="body2" fontWeight={700} sx={{ mb: 2 }}>{survey.question}</Typography>
              {counts.map((c) => (
                <Box key={c.opt} sx={{ mb: 1.5 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                    <Typography variant="body2">{c.opt}</Typography>
                    <Typography variant="body2" fontWeight={700}>{c.n} ({total ? Math.round((c.n / total) * 100) : 0}%)</Typography>
                  </Box>
                  <LinearProgress variant="determinate" value={total ? (c.n / total) * 100 : 0} sx={{ height: 8, borderRadius: 1 }} />
                </Box>
              ))}
              <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>Total responses: {total}</Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions><Button onClick={() => setViewId(null)}>Close</Button></DialogActions>
      </Dialog>
    </Box>
  );
}
