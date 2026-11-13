import { useEffect, useState } from 'react';
import { Box, Typography, Card, CardContent, Chip, Button, Tab, Tabs, Avatar, Paper, Skeleton } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const FB = (window as any).runConfig?.FIREBASE_MODE === true;
const pubGet = async (path: string) => {
  if (FB) {
    const { route } = await import('../../firebase/fbRouter');
    return route('GET', path);
  }
  const r = await axios.get(path);
  return r.data.data;
};

interface StoreTest { id: number; title: string; description: string | null; durationMin: number; questionCount: number; }
interface StoreMaterial { id: number; type: string; title: string; url: string | null; description: string | null; }

export default function StorePage() {
  const [teacherName, setTeacherName] = useState('Teacher');
  const [tests, setTests] = useState<StoreTest[]>([]);
  const [materials, setMaterials] = useState<StoreMaterial[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    pubGet('/store').then((d: any) => {
      setTeacherName(d.teacherName || 'Teacher');
      setTests(d.tests || []);
      setMaterials(d.materials || []);
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#F7F8FC' }}>
      {/* Hero header — Classplus store jaisa */}
      <Box sx={{ background: 'linear-gradient(135deg,#6C5CE7 0%,#8E7CF8 100%)', color: '#fff', py: 4, px: 2, textAlign: 'center' }}>
        <Avatar sx={{ width: 72, height: 72, mx: 'auto', bgcolor: '#fff', color: '#6C5CE7', fontSize: 32, fontWeight: 900, mb: 1 }}>
          {teacherName[0]?.toUpperCase()}
        </Avatar>
        <Typography variant="h5" fontWeight={900}>{teacherName}</Typography>
        <Typography variant="body2" sx={{ opacity: 0.9, mt: 0.5 }}>Learn. Practice. Grow. 🚀</Typography>
      </Box>

      {/* Tabs */}
      <Paper elevation={0} sx={{ position: 'sticky', top: 0, zIndex: 5, borderBottom: 1, borderColor: 'divider' }}>
        <Tabs value={tab} onChange={(_, v) => setTab(v)} variant="fullWidth">
          <Tab label={`📝 Tests (${tests.length})`} />
          <Tab label={`📚 Free Material (${materials.length})`} />
        </Tabs>
      </Paper>

      <Box sx={{ maxWidth: 900, mx: 'auto', p: 2 }}>
        {loading ? (
          <>{[1, 2, 3].map((i) => <Skeleton key={i} variant="rectangular" height={110} sx={{ mb: 2, borderRadius: 3 }} />)}</>
        ) : tab === 0 ? (
          <>
            <Typography variant="h6" fontWeight={800} sx={{ mb: 2 }}>📝 Practice Tests</Typography>
            {tests.length === 0 && (
              <Card><CardContent><Typography color="text.secondary" textAlign="center" py={3}>Abhi koi test published nahi.</Typography></CardContent></Card>
            )}
            {tests.map((t) => (
              <Card key={t.id} elevation={2} sx={{ mb: 2, borderRadius: 3 }}>
                <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
                  <Box sx={{ flexGrow: 1, minWidth: 200 }}>
                    <Typography fontWeight={800} fontSize={16}>{t.title}</Typography>
                    {t.description && <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>{t.description}</Typography>}
                    <Box sx={{ mt: 1, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                      <Chip size="small" label={`⏱ ${t.durationMin} min`} />
                      <Chip size="small" label={`📝 ${t.questionCount} questions`} />
                      <Chip size="small" color="success" label="FREE" />
                    </Box>
                  </Box>
                  <Button variant="contained" color="primary" onClick={() => navigate(`/test/${t.id}`)} sx={{ fontWeight: 800, borderRadius: 2, px: 3 }}>
                    Start Test →
                  </Button>
                </CardContent>
              </Card>
            ))}
          </>
        ) : (
          <>
            <Typography variant="h6" fontWeight={800} sx={{ mb: 2 }}>📚 Free Study Material</Typography>
            {materials.length === 0 && (
              <Card><CardContent><Typography color="text.secondary" textAlign="center">Abhi koi material published nahi.</Typography></CardContent></Card>
            )}
            {materials.map((m) => (
              <Card key={m.id} elevation={2} sx={{ mb: 2, borderRadius: 3 }}>
                <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
                  <Box sx={{ fontSize: 32 }}>
                    {m.type === 'pdf' ? '📄' : m.type === 'youtube' ? '▶️' : '🎬'}
                  </Box>
                  <Box sx={{ flexGrow: 1, minWidth: 200 }}>
                    <Typography fontWeight={800} fontSize={16}>{m.title}</Typography>
                    {m.description && <Typography variant="body2" color="text.secondary">{m.description}</Typography>}
                    <Chip size="small" color="success" label="FREE" sx={{ mt: 1 }} />
                  </Box>
                  {m.url && (
                    <Button variant="contained" color="primary" href={m.url} target="_blank" sx={{ fontWeight: 800, borderRadius: 2, px: 3 }}>
                      Get →
                    </Button>
                  )}
                </CardContent>
              </Card>
            ))}
          </>
        )}
      </Box>
    </Box>
  );
}
