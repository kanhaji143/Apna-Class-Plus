import { useEffect, useState } from 'react';
import {
  Box, Typography, Card, CardContent, Chip, Avatar, TextField, Grid, Button, IconButton,
  Dialog, DialogTitle, DialogContent, DialogActions, Alert, Stack, Tooltip,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import { get, post, del } from '../../api/client';

interface Lead {
  id: number; name: string; phone: string; source?: string; slug?: string;
  courseTitle?: string; converted?: boolean; createdAt?: any;
}
interface Student {
  id: number; name: string; phone: string; source?: string;
  courseTitle?: string; createdAt?: any;
}

const fmtDate = (v: any) => {
  if (!v) return '';
  const d = v?.toDate ? v.toDate() : (typeof v === 'string' ? new Date(v) : null);
  return d && !isNaN(d.getTime()) ? d.toLocaleDateString('en-IN') : '';
};

export default function PeopleListPage() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [msg, setMsg] = useState<{ text: string; severity: 'success' | 'error' } | null>(null);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: '', phone: '' });
  const [busy, setBusy] = useState(false);

  const load = () => {
    setLoading(true);
    get<{ leads: Lead[]; students: Student[]; total: number }>('/v2/people')
      .then((d) => { setLeads(d.leads || []); setStudents(d.students || []); })
      .catch(() => { setLeads([]); setStudents([]); })
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const flash = (text: string, severity: 'success' | 'error' = 'success') => {
    setMsg({ text, severity });
    setTimeout(() => setMsg(null), 3500);
  };

  const addStudent = async () => {
    if (!form.name.trim()) return;
    setBusy(true);
    try {
      await post('/v2/people/students', { name: form.name.trim(), phone: form.phone.trim() });
      setOpen(false); setForm({ name: '', phone: '' });
      flash('Student add ho gaya ✅');
      load();
    } catch {
      flash('Student add nahi hua — dobara try karo.', 'error');
    } finally { setBusy(false); }
  };

  const convertLead = async (l: Lead) => {
    setBusy(true);
    try {
      await post(`/v2/people/leads/${l.id}/convert`);
      flash(`${l.name} student ban gaya 🎉`);
      load();
    } catch {
      flash('Convert nahi hua — dobara try karo.', 'error');
    } finally { setBusy(false); }
  };

  const removeLead = async (l: Lead) => {
    if (!confirm(`${l.name} ka lead delete karna hai?`)) return;
    try { await del(`/v2/people/leads/${l.id}`); flash('Lead delete ho gaya.'); load(); }
    catch { flash('Delete nahi hua.', 'error'); }
  };

  const removeStudent = async (s: Student) => {
    if (!confirm(`${s.name} ko delete karna hai?`)) return;
    try { await del(`/v2/people/students/${s.id}`); flash('Student delete ho gaya.'); load(); }
    catch { flash('Delete nahi hua.', 'error'); }
  };

  const q = search.toLowerCase();
  const filteredLeads = leads.filter((l) => l.name?.toLowerCase().includes(q) || (l.phone || '').includes(search));
  const filteredStudents = students.filter((s) => s.name?.toLowerCase().includes(q) || (s.phone || '').includes(search));

  return (
    <Box>
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ mb: 3 }} alignItems={{ xs: 'stretch', sm: 'center' }}>
        <TextField size="small" placeholder="Search by name or phone" value={search} onChange={(e) => setSearch(e.target.value)} sx={{ minWidth: 260 }} />
        <Box sx={{ flexGrow: 1 }} />
        <Button variant="contained" startIcon={<AddIcon />} onClick={() => setOpen(true)}>Add Student</Button>
      </Stack>

      {msg && <Alert severity={msg.severity} sx={{ mb: 2 }} onClose={() => setMsg(null)}>{msg.text}</Alert>}

      {loading ? (
        <Typography color="text.secondary">Loading people…</Typography>
      ) : (
        <>
          <Typography variant="h6" fontWeight={800} sx={{ mb: 1 }}>Leads ({filteredLeads.length})</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Store ya landing page se aaye contacts. Inhe "Convert" karke student banao.
          </Typography>
          <Grid container spacing={2} sx={{ mb: 3 }}>
            {filteredLeads.map((l) => (
              <Grid item xs={12} sm={6} md={4} key={'lead-' + l.id}>
                <Card elevation={2}>
                  <CardContent sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
                    <Avatar sx={{ bgcolor: 'warning.main' }}>{l.name?.[0] || '?'}</Avatar>
                    <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                      <Typography fontWeight={700} noWrap>{l.name}</Typography>
                      <Typography variant="caption" color="text.secondary" display="block">{l.phone}</Typography>
                      <Typography variant="caption" display="block" color="text.secondary">
                        {l.source ? `Source: ${l.source}` : ''}{l.source && fmtDate(l.createdAt) ? ' · ' : ''}{fmtDate(l.createdAt)}
                      </Typography>
                      {l.courseTitle && (
                        <Chip size="small" variant="outlined" label={`📚 ${l.courseTitle}`} sx={{ mt: 0.5, maxWidth: '100%' }} />
                      )}
                      <Box sx={{ mt: 1 }}>
                        {l.converted ? (
                          <Chip size="small" color="success" label="✓ Converted" />
                        ) : (
                          <Button size="small" variant="contained" color="warning" startIcon={<PersonAddIcon />} disabled={busy} onClick={() => convertLead(l)}>
                            Convert
                          </Button>
                        )}
                      </Box>
                    </Box>
                    <Tooltip title="Delete lead">
                      <IconButton size="small" color="error" onClick={() => removeLead(l)}><DeleteIcon fontSize="small" /></IconButton>
                    </Tooltip>
                  </CardContent>
                </Card>
              </Grid>
            ))}
            {filteredLeads.length === 0 && <Grid item xs={12}><Typography color="text.secondary">No leads yet.</Typography></Grid>}
          </Grid>

          <Typography variant="h6" fontWeight={800} sx={{ mb: 1 }}>Students ({filteredStudents.length})</Typography>
          <Grid container spacing={2}>
            {filteredStudents.map((s) => (
              <Grid item xs={12} sm={6} md={4} key={'student-' + s.id}>
                <Card elevation={2}>
                  <CardContent sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
                    <Avatar sx={{ bgcolor: 'primary.main' }}>{s.name?.[0] || '?'}</Avatar>
                    <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                      <Typography fontWeight={700} noWrap>{s.name}</Typography>
                      <Typography variant="caption" color="text.secondary" display="block">{s.phone}</Typography>
                      <Typography variant="caption" color="text.secondary" display="block">
                        {s.source ? `${s.source}` : 'Manual'}{fmtDate(s.createdAt) ? ` · ${fmtDate(s.createdAt)}` : ''}
                      </Typography>
                      {s.courseTitle && (
                        <Chip size="small" variant="outlined" label={`📚 ${s.courseTitle}`} sx={{ mt: 0.5, maxWidth: '100%' }} />
                      )}
                    </Box>
                    <Tooltip title="Delete student">
                      <IconButton size="small" color="error" onClick={() => removeStudent(s)}><DeleteIcon fontSize="small" /></IconButton>
                    </Tooltip>
                  </CardContent>
                </Card>
              </Grid>
            ))}
            {filteredStudents.length === 0 && <Grid item xs={12}><Typography color="text.secondary">No students yet.</Typography></Grid>}
          </Grid>
        </>
      )}

      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Add Student</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 2 }}>
          <TextField label="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} fullWidth autoFocus />
          <TextField label="Phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} fullWidth />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>Cancel</Button>
          <Button variant="contained" disabled={!form.name.trim() || busy} onClick={addStudent}>
            {busy ? 'Saving…' : 'Add'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
