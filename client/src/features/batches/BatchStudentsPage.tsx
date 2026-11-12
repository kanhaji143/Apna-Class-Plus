import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Box, Button, Card, CardContent, Typography, TextField, IconButton, Chip, Avatar,
  Dialog, DialogTitle, DialogContent, DialogActions,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { get, post, api } from '../../api/client';

interface Student { id: number; name: string; phone: string; role: string; enrolled_at: string; }
interface Batch { id: number; name: string; courseTitle: string; status: string; }

export default function BatchStudentsPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [batch, setBatch] = useState<Batch | null>(null);
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ phone: '', name: '' });
  const [adding, setAdding] = useState(false);

  const load = () => {
    get<any>(`/v2/batches/${id}`).then((b) => { setBatch(b); setStudents(b.students || []); }).catch(() => {}).finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [id]);

  const addStudent = async () => {
    setAdding(true);
    try {
      await post('/v2/batch/students/add', { batchId: Number(id), phone: form.phone, name: form.name });
      setOpen(false); setForm({ phone: '', name: '' });
      load();
    } finally { setAdding(false); }
  };

  const removeStudent = async (studentId: number) => {
    if (!confirm('Student remove karna hai?')) return;
    await api.delete('/v2/batch/students/remove', { data: { batchId: Number(id), studentId } });
    load();
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
        <Button startIcon={<ArrowBackIcon />} onClick={() => navigate('/batches')}>Back</Button>
        <Typography variant="h5" fontWeight={800}>{batch?.name || 'Batch'} — Students</Typography>
        <Box sx={{ flexGrow: 1 }} />
        <Button variant="contained" startIcon={<AddIcon />} onClick={() => setOpen(true)}>Add Student</Button>
      </Box>

      {loading ? (
        <Typography color="text.secondary">Loading…</Typography>
      ) : students.length === 0 ? (
        <Card><CardContent>
          <Typography variant="h6">Koi student nahi hai</Typography>
          <Typography variant="body2" color="text.secondary">"Add Student" se student add karo (phone se).</Typography>
        </CardContent></Card>
      ) : (
        <Box>
          {students.map((s) => (
            <Card key={s.id} elevation={2} sx={{ mb: 1 }}>
              <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2, py: 1.5 }}>
                <Avatar>{s.name?.[0] || '?'}</Avatar>
                <Box sx={{ flexGrow: 1 }}>
                  <Typography fontWeight={700}>{s.name}</Typography>
                  <Typography variant="caption" color="text.secondary">{s.phone} · enrolled {s.enrolled_at}</Typography>
                </Box>
                <Chip size="small" label={s.role} />
                <IconButton size="small" color="error" onClick={() => removeStudent(s.id)}>
                  <DeleteIcon fontSize="small" />
                </IconButton>
              </CardContent>
            </Card>
          ))}
        </Box>
      )}

      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Add Student to Batch</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 2 }}>
          <TextField label="Phone (10 digit)" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} fullWidth />
          <TextField label="Name (optional)" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} fullWidth />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>Cancel</Button>
          <Button variant="contained" disabled={!form.phone || adding} onClick={addStudent}>
            {adding ? 'Adding…' : 'Add'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
