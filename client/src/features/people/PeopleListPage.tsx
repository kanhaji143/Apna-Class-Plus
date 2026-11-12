import { useEffect, useState } from 'react';
import { Box, Typography, Card, CardContent, Chip, Avatar, TextField, Grid } from '@mui/material';
import { get } from '../../api/client';

interface Lead { id: number; name: string; phone: string; created_at: string; source: string; type: string; }
interface Student { id: number; name: string; phone: string; created_at: string; type: string; }

export default function PeopleListPage() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    get<{ leads: Lead[]; students: Student[]; total: number }>('/v2/people')
      .then((d) => { setLeads(d.leads); setStudents(d.students); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const filteredLeads = leads.filter((l) => l.name.toLowerCase().includes(search.toLowerCase()) || l.phone.includes(search));
  const filteredStudents = students.filter((s) => s.name.toLowerCase().includes(search.toLowerCase()) || s.phone.includes(search));

  return (
    <Box>
      <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap' }}>
        <TextField size="small" placeholder="Search by name or phone" value={search} onChange={(e) => setSearch(e.target.value)} sx={{ minWidth: 260 }} />
      </Box>

      {loading ? (
        <Typography color="text.secondary">Loading people…</Typography>
      ) : (
        <>
          <Typography variant="h6" fontWeight={800} sx={{ mb: 1 }}>Leads ({filteredLeads.length})</Typography>
          <Grid container spacing={2} sx={{ mb: 3 }}>
            {filteredLeads.map((l) => (
              <Grid item xs={12} sm={6} md={4} key={'lead-' + l.id}>
                <Card elevation={2}>
                  <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Avatar sx={{ bgcolor: 'warning.main' }}>{l.name?.[0] || '?'}</Avatar>
                    <Box sx={{ flexGrow: 1 }}>
                      <Typography fontWeight={700}>{l.name}</Typography>
                      <Typography variant="caption" color="text.secondary">{l.phone}</Typography>
                      <Typography variant="caption" display="block" color="text.secondary">Source: {l.source}</Typography>
                    </Box>
                    <Chip size="small" label="Lead" color="warning" />
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
                  <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Avatar sx={{ bgcolor: 'primary.main' }}>{s.name?.[0] || '?'}</Avatar>
                    <Box sx={{ flexGrow: 1 }}>
                      <Typography fontWeight={700}>{s.name}</Typography>
                      <Typography variant="caption" color="text.secondary">{s.phone}</Typography>
                    </Box>
                    <Chip size="small" label="Student" color="primary" />
                  </CardContent>
                </Card>
              </Grid>
            ))}
            {filteredStudents.length === 0 && <Grid item xs={12}><Typography color="text.secondary">No students yet.</Typography></Grid>}
          </Grid>
        </>
      )}
    </Box>
  );
}
