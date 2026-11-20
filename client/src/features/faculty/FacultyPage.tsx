import { useEffect, useState } from 'react';
import {
  Box, Typography, Card, CardContent, Button, TextField, IconButton, Tooltip,
  Dialog, DialogTitle, DialogContent, DialogActions,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import { get, post, del } from '../../api/client';

interface Faculty { id: number; name: string; subject: string; bio: string; experience: string; }

/** Teacher profiles — public store par "Faculty" tab mein dikhte hain. */
export default function FacultyPage() {
  const [items, setItems] = useState<Faculty[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: '', subject: '', bio: '', experience: '' });
  const [busy, setBusy] = useState(false);

  const load = () => {
    get<Faculty[]>('/v2/faculty').then(setItems).catch(() => setItems([])).finally(() => setLoading(false));
  };
  useEffect(load, []);

  const save = async () => {
    if (!form.name.trim()) return;
    setBusy(true);
    try {
      await post('/v2/faculty', form);
      setOpen(false);
      setForm({ name: '', subject: '', bio: '', experience: '' });
      load();
    } finally { setBusy(false); }
  };

  const remove = async (id: number) => {
    if (!window.confirm('Faculty profile delete karna hai?')) return;
    await del(`/v2/faculty/${id}`);
    load();
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3, flexWrap: 'wrap' }}>
        <Box sx={{ flexGrow: 1 }}>
          <Typography variant="h5" fontWeight={900}>Faculty</Typography>
          <Typography variant="body2" color="text.secondary">
            Teacher profiles — public store ke "Faculty" tab mein dikhte hain.
          </Typography>
        </Box>
        <Button variant="contained" startIcon={<AddIcon />} onClick={() => setOpen(true)}>Add Faculty</Button>
      </Box>

      {loading ? (
        <Typography color="text.secondary">Loading faculty…</Typography>
      ) : items.length === 0 ? (
        <Card><CardContent>
          <Typography variant="h6">Koi faculty profile nahi</Typography>
          <Typography variant="body2" color="text.secondary">"Add Faculty" se pehla profile banao.</Typography>
        </CardContent></Card>
      ) : (
        <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(240px,1fr))', gap: 2 }}>
          {items.map((f) => (
            <Card key={f.id} elevation={2} sx={{ borderRadius: 3 }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1 }}>
                  <Typography sx={{ width: 44, height: 44, borderRadius: '50%', display: 'grid', placeItems: 'center', bgcolor: 'primary.main', color: '#fff', fontWeight: 900, flexShrink: 0 }}>
                    {f.name?.[0] || '?'}
                  </Typography>
                  <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                    <Typography fontWeight={800}>{f.name}</Typography>
                    <Typography variant="caption" color="primary">{f.subject}</Typography>
                  </Box>
                  <Tooltip title="Delete">
                    <IconButton size="small" color="error" onClick={() => remove(f.id)}><DeleteIcon fontSize="small" /></IconButton>
                  </Tooltip>
                </Box>
                {f.experience && <Typography variant="caption" color="text.secondary" display="block">{f.experience}</Typography>}
                {f.bio && <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>{f.bio}</Typography>}
              </CardContent>
            </Card>
          ))}
        </Box>
      )}

      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Add Faculty</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 2 }}>
          <TextField label="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} fullWidth autoFocus />
          <TextField label="Subject / Specialization" value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} fullWidth />
          <TextField label="Experience" value={form.experience} onChange={(e) => setForm({ ...form, experience: e.target.value })} fullWidth placeholder="10+ years…" />
          <TextField label="Bio" multiline rows={3} value={form.bio} onChange={(e) => setForm({ ...form, bio: e.target.value })} fullWidth />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>Cancel</Button>
          <Button variant="contained" disabled={!form.name.trim() || busy} onClick={save}>
            {busy ? 'Saving…' : 'Save'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
