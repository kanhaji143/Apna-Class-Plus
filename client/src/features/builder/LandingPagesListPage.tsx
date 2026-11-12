import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box, Button, Card, CardContent, Typography, Grid, Chip, IconButton, TextField,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import { get } from '../../api/client';

interface PageRow { _id: number; title: string; slug: string | null; type: string; status: string; totalVisitors: number; createdAt: string; }

export default function LandingPagesListPage() {
  const [pages, setPages] = useState<PageRow[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    get<{ data: PageRow[] }>('/v1/diy/landingPages?offset=0&limit=50')
      .then((d) => setPages(d.data))
      .catch(() => setPages([]))
      .finally(() => setLoading(false));
  }, []);

  const filtered = pages.filter((p) => p.title.toLowerCase().includes(search.toLowerCase()));

  return (
    <Box>
      <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap' }}>
        <TextField
          size="small" placeholder="Search by page name" value={search}
          onChange={(e) => setSearch(e.target.value)} sx={{ minWidth: 260 }}
        />
        <Button variant="contained" startIcon={<AddIcon />} onClick={() => navigate('/landing-pages/create')}>
          Create New Page
        </Button>
      </Box>

      {loading ? (
        <Typography color="text.secondary">Loading pages…</Typography>
      ) : filtered.length === 0 ? (
        <Card><CardContent>
          <Typography variant="h6">Koi landing page nahi hai</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            "Create New Page" se pehli page banao — Webinar / Course / Form template.
          </Typography>
        </CardContent></Card>
      ) : (
        <Grid container spacing={2}>
          {filtered.map((p) => (
            <Grid item xs={12} sm={6} md={4} key={p._id}>
              <Card elevation={3} sx={{ cursor: 'pointer' }} onClick={() => navigate(`/landing-pages/edit/${p._id}`)}>
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                    <Typography variant="h6" noWrap sx={{ maxWidth: 220 }}>{p.title}</Typography>
                    <Chip size="small" label={p.status} color={p.status === 'published' ? 'success' : 'default'} />
                  </Box>
                  <Typography variant="body2" color="text.secondary">{p.type} · {p.createdAt}</Typography>
                  <Box sx={{ mt: 2, display: 'flex', gap: 1 }}>
                    <Button size="small" variant="outlined" onClick={(e) => { e.stopPropagation(); navigate(`/landing-pages/edit/${p._id}`); }}>
                      Edit
                    </Button>
                    {p.slug && (
                      <IconButton size="small" onClick={(e) => { e.stopPropagation(); window.open('/lp-preview/' + p.slug, '_blank'); }}>
                        <OpenInNewIcon fontSize="small" />
                      </IconButton>
                    )}
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}
    </Box>
  );
}
