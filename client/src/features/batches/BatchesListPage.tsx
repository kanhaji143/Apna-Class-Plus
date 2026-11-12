import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box, Button, Card, CardContent, Typography, Grid, Chip, IconButton, TextField,
  Dialog, DialogTitle, DialogContent, DialogActions, MenuItem, Select, FormControl, InputLabel,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import PeopleIcon from '@mui/icons-material/People';
import DeleteIcon from '@mui/icons-material/Delete';
import { get, post, del } from '../../api/client';

interface Batch { id: number; course_id: number; name: string; start_date: string; end_date: string; status: string; courseTitle: string; studentCount: number; created_at: string; }
interface Course { id: number; title: string; }

export default function BatchesListPage() {
  const [batches, setBatches] = useState<Batch[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ courseId: '', name: '', startDate: '', endDate: '' });
  const [creating, setCreating] = useState(false);
  const navigate = useNavigate();

  const load = () => {
    get<Batch[]>('/v2/batches').then(setBatches).catch(() => setBatches([]));
    get<{ data: Course[] }>('/v2/courses').then((d) => setCourses(d.data)).catch(() => setCourses([]));
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const create = async () => {
    setCreating(true);
    try {
      await post('/v2/batches', { courseId: Number(form.courseId), name: form.name, startDate: form.startDate, endDate: form.endDate });
      setOpen(false); setForm({ courseId: '', name: '', startDate: '', endDate: '' });
      load();
    } finally { setCreating(false); }
  };

  const archive = async (id: number) => {
    if (!confirm('Batch archive karna hai?')) return;
    await del(`/v2/batches/${id}`);
    load();
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap' }}>
        <Button variant="contained" startIcon={<AddIcon />} onClick={() => setOpen(true)}>
          Create New Batch
        </Button>
      </Box>

      {loading ? (
        <Typography color="text.secondary">Loading batches…</Typography>
      ) : batches.length === 0 ? (
        <Card><CardContent>
          <Typography variant="h6">Koi batch nahi hai</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            "Create New Batch" se pehla batch banao.
          </Typography>
        </CardContent></Card>
      ) : (
        <Grid container spacing={2}>
          {batches.map((b) => (
            <Grid item xs={12} sm={6} md={4} key={b.id}>
              <Card elevation={3}>
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                    <Typography variant="h6" noWrap sx={{ maxWidth: 200 }}>{b.name}</Typography>
                    <Chip size="small" label={b.status} color={b.status === 'active' ? 'success' : 'default'} />
                  </Box>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                    {b.courseTitle} · {b.studentCount} students
                  </Typography>
                  {b.start_date && <Typography variant="caption" color="text.secondary">Start: {b.start_date}</Typography>}
                  <Box sx={{ mt: 2, display: 'flex', gap: 1 }}>
                    <Button size="small" variant="outlined" startIcon={<PeopleIcon />}
                      onClick={() => navigate(`/batches/${b.id}/students`)}>
                      Manage Students
                    </Button>
                    <IconButton size="small" onClick={() => archive(b.id)}>
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
        <DialogTitle>Create New Batch</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 2 }}>
          <FormControl fullWidth>
            <InputLabel>Course</InputLabel>
            <Select label="Course" value={form.courseId} onChange={(e) => setForm({ ...form, courseId: e.target.value })}>
              {courses.map((c) => <MenuItem key={c.id} value={c.id}>{c.title}</MenuItem>)}
            </Select>
          </FormControl>
          <TextField label="Batch Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} fullWidth />
          <TextField label="Start Date" type="date" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} fullWidth InputLabelProps={{ shrink: true }} />
          <TextField label="End Date" type="date" value={form.endDate} onChange={(e) => setForm({ ...form, endDate: e.target.value })} fullWidth InputLabelProps={{ shrink: true }} />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>Cancel</Button>
          <Button variant="contained" disabled={!form.name || !form.courseId || creating} onClick={create}>
            {creating ? 'Creating…' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
