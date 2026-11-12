import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box, Button, Card, CardContent, Chip, Dialog, DialogTitle, DialogContent, DialogActions,
  Typography, TextField, FormControl, InputLabel, Select, MenuItem, IconButton, Tooltip,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import QuizIcon from '@mui/icons-material/Quiz';
import { get, post, del } from '../../api/client';

interface Test {
  id: number; title: string; description: string | null; duration_min: number;
  status: string; question_count: number; attempt_count: number; course_title: string | null;
}

export default function TestPortalPage() {
  const navigate = useNavigate();
  const [tests, setTests] = useState<Test[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ title: '', description: '', durationMin: 30 });
  const [creating, setCreating] = useState(false);

  const load = () => {
    get<Test[]>('/v3/tests').then(setTests).catch(() => {}).finally(() => setLoading(false));
  };
  useEffect(load, []);

  const create = async () => {
    if (!form.title.trim()) return;
    setCreating(true);
    try {
      const r = await post<{ id: number }>('/v3/tests', form);
      setOpen(false);
      navigate(`/content/test-portal/${r.id}`);
    } finally { setCreating(false); }
  };

  const remove = async (id: number) => {
    if (!confirm('Test + saare questions delete karne hain?')) return;
    await del(`/v3/tests/${id}`);
    load();
  };

  const copyPublicLink = (id: number) => {
    const url = `${location.origin}/test/${id}`;
    navigator.clipboard.writeText(url);
    alert('Public test link copy ho gaya:\n' + url);
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3, flexWrap: 'wrap' }}>
        <Typography variant="h5" fontWeight={800} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <QuizIcon color="primary" /> Test Portal
        </Typography>
        <Box sx={{ flexGrow: 1 }} />
        <Button variant="contained" startIcon={<AddIcon />} onClick={() => setOpen(true)}>Create Test</Button>
      </Box>

      {loading ? (
        <Typography color="text.secondary">Loading tests…</Typography>
      ) : tests.length === 0 ? (
        <Card elevation={2}><CardContent>
          <Typography color="text.secondary">Koi test nahi hai. "Create Test" se pehla test banao!</Typography>
        </CardContent></Card>
      ) : (
        tests.map((t) => (
          <Card key={t.id} elevation={2} sx={{ mb: 2 }}>
            <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
              <Box sx={{ flexGrow: 1, minWidth: 220 }}>
                <Typography variant="subtitle1" fontWeight={800}>{t.title}</Typography>
                <Typography variant="caption" color="text.secondary">
                  ⏱ {t.duration_min} min · 📝 {t.question_count} questions · 👥 {t.attempt_count} attempts
                  {t.course_title ? ` · 📚 ${t.course_title}` : ''}
                </Typography>
              </Box>
              <Chip size="small" label={t.status === 'published' ? '🟢 Published' : '⚪ Draft'}
                color={t.status === 'published' ? 'success' : 'default'} variant="outlined" />
              <Tooltip title="Public link copy"><IconButton onClick={() => copyPublicLink(t.id)}><ContentCopyIcon fontSize="small" /></IconButton></Tooltip>
              <Button size="small" variant="outlined" startIcon={<EditIcon />} onClick={() => navigate(`/content/test-portal/${t.id}`)}>Edit</Button>
              <Button size="small" color="error" onClick={() => remove(t.id)}>Delete</Button>
            </CardContent>
          </Card>
        ))
      )}

      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Create Test</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 2 }}>
          <TextField label="Test title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} fullWidth autoFocus />
          <TextField label="Description (optional)" multiline rows={2} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} fullWidth />
          <FormControl fullWidth>
            <InputLabel>Duration (minutes)</InputLabel>
            <Select label="Duration (minutes)" value={form.durationMin} onChange={(e) => setForm({ ...form, durationMin: Number(e.target.value) })}>
              {[10, 15, 20, 30, 45, 60, 90, 120].map((m) => <MenuItem key={m} value={m}>{m} min</MenuItem>)}
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>Cancel</Button>
          <Button variant="contained" disabled={!form.title.trim() || creating} onClick={create}>
            {creating ? 'Creating…' : 'Create & Add Questions'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
