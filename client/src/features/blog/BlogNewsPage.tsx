import { useEffect, useState } from 'react';
import {
  Box, Typography, Card, CardContent, Button, TextField, Chip, IconButton, Tooltip, Dialog, DialogTitle, DialogContent, DialogActions, FormControl, InputLabel, Select, MenuItem,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import { get, post, del } from '../../api/client';

interface Post { _id: number; title: string; body: string; type: string; status: string; createdAt: string; }

const fmtDate = (v: any) => {
  if (!v) return '';
  const d = v?.toDate ? v.toDate() : new Date(v);
  return isNaN(d.getTime()) ? '' : d.toLocaleDateString('en-IN');
};

/** Teacher-side blog/news/shorts manager — store par "Blog & News" tab mein dikhega. */
export default function BlogNewsPage() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ title: '', body: '', type: 'blog', status: 'published' });
  const [busy, setBusy] = useState(false);

  const load = () => {
    get<Post[]>('/v1/diy/posts').then(setPosts).catch(() => setPosts([])).finally(() => setLoading(false));
  };
  useEffect(load, []);

  const save = async () => {
    if (!form.title.trim()) return;
    setBusy(true);
    try {
      await post('/v1/diy/posts', form);
      setOpen(false);
      setForm({ title: '', body: '', type: 'blog', status: 'published' });
      load();
    } finally { setBusy(false); }
  };

  const remove = async (id: number) => {
    if (!window.confirm('Post delete karna hai?')) return;
    await del(`/v1/diy/posts/${id}`);
    load();
  };

  const typeIcon = (t: string) => (t === 'short' ? '🎬' : t === 'news' ? '📰' : '📝');

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3, flexWrap: 'wrap' }}>
        <Box sx={{ flexGrow: 1 }}>
          <Typography variant="h5" fontWeight={900}>Blog & News</Typography>
          <Typography variant="body2" color="text.secondary">
            Posts banao — public store ke "Blog & News" tab mein dikhega.
          </Typography>
        </Box>
        <Button variant="contained" startIcon={<AddIcon />} onClick={() => setOpen(true)}>New Post</Button>
      </Box>

      {loading ? (
        <Typography color="text.secondary">Loading…</Typography>
      ) : posts.length === 0 ? (
        <Card><CardContent>
          <Typography variant="h6">Koi post nahi</Typography>
          <Typography variant="body2" color="text.secondary">"New Post" se pehla post banao.</Typography>
        </CardContent></Card>
      ) : (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {posts.map((p) => (
            <Card key={p._id} elevation={2}>
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', gap: 1 }}>
                  <Typography fontWeight={800}>{typeIcon(p.type)} {p.title}</Typography>
                  <Chip size="small" label={p.status} color={p.status === 'published' ? 'success' : 'default'} />
                </Box>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1, whiteSpace: 'pre-wrap' }}>
                  {p.body?.slice(0, 240)}
                </Typography>
                <Box sx={{ mt: 1, display: 'flex', gap: 1, alignItems: 'center' }}>
                  <Chip size="small" variant="outlined" label={p.type} />
                  {fmtDate(p.createdAt) && <Typography variant="caption" color="text.secondary">{fmtDate(p.createdAt)}</Typography>}
                  <Box sx={{ flexGrow: 1 }} />
                  <Tooltip title="Delete">
                    <IconButton size="small" color="error" onClick={() => remove(p._id)}><DeleteIcon fontSize="small" /></IconButton>
                  </Tooltip>
                </Box>
              </CardContent>
            </Card>
          ))}
        </Box>
      )}

      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>New Post</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 2 }}>
          <TextField label="Title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} fullWidth autoFocus />
          <FormControl fullWidth>
            <InputLabel>Type</InputLabel>
            <Select label="Type" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
              <MenuItem value="blog">Blog (long post)</MenuItem>
              <MenuItem value="news">News (announcement)</MenuItem>
              <MenuItem value="short">Short (quick tip)</MenuItem>
            </Select>
          </FormControl>
          <TextField label="Body" multiline rows={6} value={form.body} onChange={(e) => setForm({ ...form, body: e.target.value })} fullWidth />
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
          <Button variant="contained" disabled={!form.title.trim() || busy} onClick={save}>
            {busy ? 'Saving…' : 'Publish'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
