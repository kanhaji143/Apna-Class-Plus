import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Box, Card, CardContent, Chip, Typography } from '@mui/material';
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

/**
 * PUBLIC Free Material page (/free/:teacherId) — koi login nahi.
 * Student yahan teacher ke free PDFs/videos dekh + access kar sakta hai (lead magnet).
 */
interface Material { id: number; type: string; title: string; url: string | null; description: string | null; }

const icon = (t: string) => (t === 'pdf' ? '📄' : t === 'youtube' ? '▶️' : '🎬');

export default function PublicFreeMaterialsPage() {
  const { teacherId } = useParams();
  const [teacherName, setTeacherName] = useState('');
  const [items, setItems] = useState<Material[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    pubGet(`/lp/api/free-materials?teacher=${teacherId}`)
      .then((d: any) => { setTeacherName(d.teacherName); setItems(d.items); })
      .catch((e) => setError(e?.response?.data?.message || 'Load fail hua'));
  }, [teacherId]);

  if (error) {
    return <Box sx={{ minHeight: '100vh', display: 'grid', placeItems: 'center', bgcolor: '#F7F8FC' }}>
      <Typography>😕 {error}</Typography>
    </Box>;
  }

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#F7F8FC', py: 5 }}>
      <Box sx={{ maxWidth: 640, mx: 'auto', px: 2 }}>
        <Box sx={{ textAlign: 'center', mb: 4 }}>
          <Typography variant="h3">🎁</Typography>
          <Typography variant="h4" fontWeight={900} sx={{ mt: 1 }}>Free Study Material</Typography>
          {teacherName && <Typography color="text.secondary">by {teacherName} · Apna Class Plus</Typography>}
        </Box>

        {items.length === 0 ? (
          <Typography color="text.secondary" sx={{ textAlign: 'center' }}>Abhi koi free material published nahi hai.</Typography>
        ) : (
          items.map((m) => (
            <Card key={m.id} elevation={2} sx={{ mb: 2 }}>
              <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Typography variant="h4">{icon(m.type)}</Typography>
                <Box sx={{ flexGrow: 1 }}>
                  <Typography variant="body1" fontWeight={800}>{m.title}</Typography>
                  {m.description && <Typography variant="body2" color="text.secondary">{m.description}</Typography>}
                </Box>
                {m.url && (
                  <Chip label="Get →" color="primary" component="a" href={m.url} target="_blank" clickable />
                )}
              </CardContent>
            </Card>
          ))
        )}
      </Box>
    </Box>
  );
}
