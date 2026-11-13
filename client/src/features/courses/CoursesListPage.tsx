import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box, Button, Card, CardContent, Typography, Grid, Chip, IconButton, TextField, Dialog, DialogTitle, DialogContent, DialogActions,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import LinkIcon from '@mui/icons-material/Link';
import AccessLinkDialog from './AccessLinkDialog';
import { get, post, del } from '../../api/client';

interface Course { id: number; title: string; price: number; currency: string; description: string; status: string; created_at: string; }

export default function CoursesListPage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [price, setPrice] = useState('0');
  const [desc, setDesc] = useState('');
  const [creating, setCreating] = useState(false);
  const [shareCourse, setShareCourse] = useState<Course | null>(null);
  const navigate = useNavigate();

  const load = () => {
    get<{ data: Course[] }>('/v2/courses').then((d) => setCourses(d.data)).catch(() => setCourses([])).finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const create = async () => {
    setCreating(true);
    try {
      await post('/v2/courses', { title, price: Number(price), description: desc });
      setOpen(false); setTitle(''); setPrice('0'); setDesc('');
      load();
    } finally { setCreating(false); }
  };

  const archive = async (id: number) => {
    if (!confirm('Course archive karna hai?')) return;
    await del(`/v2/courses/${id}`);
    load();
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap' }}>
        <Button variant="contained" startIcon={<AddIcon />} onClick={() => setOpen(true)}>
          Create New Course
        </Button>
      </Box>

      {loading ? (
        <Typography color="text.secondary">Loading courses…</Typography>
      ) : courses.length === 0 ? (
        <Card><CardContent>
          <Typography variant="h6">Koi course nahi hai</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            "Create New Course" se pehla course banao.
          </Typography>
        </CardContent></Card>
      ) : (
        <Grid container spacing={2}>
          {courses.map((c) => (
            <Grid item xs={12} sm={6} md={4} key={c.id}>
              <Card elevation={3}>
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                    <Typography variant="h6" noWrap sx={{ maxWidth: 220 }}>{c.title}</Typography>
                    <Chip size="small" label={c.status} color={c.status === 'active' ? 'success' : 'default'} />
                  </Box>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                    {c.currency} {c.price} · {c.description?.slice(0, 60)}
                  </Typography>
                  <Box sx={{ mt: 2, display: 'flex', gap: 1, alignItems: 'center' }}>
                    <Button size="small" variant="outlined" startIcon={<EditIcon />}
                      onClick={() => navigate(`/courses/${c.id}/content`)}>
                      Manage Content
                    </Button>
                    <IconButton size="small" title="Share course access link" onClick={() => setShareCourse(c)}>
                      <LinkIcon fontSize="small" />
                    </IconButton>
                    <IconButton size="small" onClick={() => archive(c.id)}>
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
        <DialogTitle>Create New Course</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 2 }}>
          <TextField label="Course Title" value={title} onChange={(e) => setTitle(e.target.value)} fullWidth />
          <TextField label="Price (INR)" type="number" value={price} onChange={(e) => setPrice(e.target.value)} fullWidth />
          <TextField label="Description" multiline rows={3} value={desc} onChange={(e) => setDesc(e.target.value)} fullWidth />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>Cancel</Button>
          <Button variant="contained" disabled={!title || creating} onClick={create}>
            {creating ? 'Creating…' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>

      <AccessLinkDialog
        open={!!shareCourse}
        onClose={() => setShareCourse(null)}
        courseId={shareCourse?.id ?? null}
        courseTitle={shareCourse?.title}
      />
    </Box>
  );
}
