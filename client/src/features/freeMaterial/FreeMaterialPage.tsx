import { useEffect, useState } from 'react';
import {
  Box, Button, Card, CardContent, Chip, Dialog, DialogTitle, DialogContent, DialogActions,
  Typography, TextField, FormControl, InputLabel, Select, MenuItem, IconButton, Tooltip,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import CardGiftcardIcon from '@mui/icons-material/CardGiftcard';
import { get, post, put, del } from '../../api/client';

interface Material { id: number; type: string; title: string; url: string | null; description: string | null; status: string; }

const TYPES = [
  { value: 'pdf', label: '📄 PDF' },
  { value: 'video', label: '🎬 Video' },
  { value: 'youtube', label: '▶️ YouTube' },
];

export default function FreeMaterialPage() {
  const [items, setItems] = useState<Material[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({ type: 'pdf', title: '', url: '', description: '', status: 'published' });

  const load = () => {
    get<Material[]>('/v3/free-materials').then(setItems).catch(() => {}).finally(() => setLoading(false));
  };
  useEffect(load, []);

  const save = async () => {
    if (!form.title.trim()) return;
    setCreating(true);
    try {
      if (editingId) await put(`/v3/free-materials/${editingId}`, form);
      else await post('/v3/free-materials', form);
      setOpen(false); setEditingId(null);
      setForm({ type: 'pdf', title: '', url: '', description: '', status: 'published' });
      load();
    } finally { setCreating(false); }
  };

  const remove = async (id: number) => {
    if (!confirm('Delete karna hai?')) return;
    await del(`/v3/free-materials/${id}`);
    load();
  };

  const toggleStatus = async (m: Material) => {
    await put(`/v3/free-materials/${m.id}`, { status: m.status === 'published' ? 'draft' : 'published' });
    load();
  };

  const edit = (m: Material) => {
    setEditingId(m.id);
    setForm({ type: m.type, title: m.title, url: m.url || '', description: m.description || '', status: m.status });
    setOpen(true);
  };

  const copyPublicLink = () => {
    const u = `${location.origin}/free/1`;
    navigator.clipboard.writeText(u);
    alert('Public Free Material page link copy ho gaya:\n' + u);
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3, flexWrap: 'wrap' }}>
        <Typography variant="h5" fontWeight={800} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <CardGiftcardIcon color="primary" /> Free Material
        </Typography>
        <Box sx={{ flexGrow: 1 }} />
        <Tooltip title="Public page link copy"><IconButton onClick={copyPublicLink}><ContentCopyIcon /></IconButton></Tooltip>
        <Tooltip title="Public page kholo">
          <IconButton onClick={() => window.open(`${location.origin}/free/1`, '_blank')}><OpenInNewIcon /></IconButton>
        </Tooltip>
        <Button variant="contained" startIcon={<AddIcon />} onClick={() => { setEditingId(null); setOpen(true); }}>Add Material</Button>
      </Box>

      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        Free PDFs/videos jo koi bhi student access kar sakta hai — lead magnet ke liye. Published items landing pages ke "Free Material" section mein live dikhte hain.
      </Typography>

      {loading ? (
        <Typography color="text.secondary">Loading…</Typography>
      ) : items.length === 0 ? (
        <Card elevation={2}><CardContent><Typography color="text.secondary">Koi free material nahi. Add karo!</Typography></CardContent></Card>
      ) : (
        items.map((m) => (
          <Card key={m.id} elevation={2} sx={{ mb: 1.5 }}>
            <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap', py: 1.5 }}>
              <Box sx={{ flexGrow: 1, minWidth: 200 }}>
                <Typography variant="body1" fontWeight={700}>{TYPES.find((t) => t.value === m.type)?.label ?? '📎'} {m.title}</Typography>
                {m.url && <Typography variant="caption" color="text.secondary" noWrap sx={{ display: 'block' }}>{m.url}</Typography>}
              </Box>
              <Chip size="small" label={m.status === 'published' ? '🟢 Published' : '⚪ Draft'}
                variant="outlined" color={m.status === 'published' ? 'success' : 'default'} clickable onClick={() => toggleStatus(m)} />
              <Button size="small" onClick={() => edit(m)}>Edit</Button>
              <IconButton size="small" color="error" onClick={() => remove(m.id)}><DeleteIcon fontSize="small" /></IconButton>
            </CardContent>
          </Card>
        ))
      )}

      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{editingId ? 'Edit Material' : 'Add Free Material'}</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 2 }}>
          <FormControl fullWidth>
            <InputLabel>Type</InputLabel>
            <Select label="Type" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
              {TYPES.map((t) => <MenuItem key={t.value} value={t.value}>{t.label}</MenuItem>)}
            </Select>
          </FormControl>
          <TextField label="Title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} fullWidth autoFocus />
          <TextField label="URL (pdf/video link)" value={form.url} onChange={(e) => setForm({ ...form, url: e.target.value })} fullWidth />
          <TextField label="Description (optional)" multiline rows={2} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} fullWidth />
          <FormControl fullWidth>
            <InputLabel>Status</InputLabel>
            <Select label="Status" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
              <MenuItem value="published">Published (public)</MenuItem>
              <MenuItem value="draft">Draft (hidden)</MenuItem>
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>Cancel</Button>
          <Button variant="contained" disabled={!form.title.trim() || creating} onClick={save}>
            {creating ? 'Saving…' : 'Save'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
