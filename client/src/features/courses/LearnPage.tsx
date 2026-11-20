import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import {
  Box, Typography, Card, CardContent, Chip, Divider, Button, CircularProgress, Paper, Avatar,
} from '@mui/material';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import { db, FB_MODE, doc, getDoc, updateDoc } from '../../firebase/fb';
import { post } from '../../api/client';

interface Item { id: number; title: string; type: string; url: string; description?: string; folderId: number | null; sortOrder: number; }
interface Folder { id: number; name: string; parentId: number | null; sortOrder: number; }

const typeIcon = (t: string) => ({ video: '▶️', pdf: '📄', audio: '🎧', link: '🔗', image: '🖼️' } as Record<string, string>)[t] || '📎';

/**
 * PUBLIC course viewer — teacher ke share link (/learn/<token>) se khulta hai.
 * Bina login: token hi capability URL hai; content snapshot `courseLinks` doc mein hai.
 */
export default function LearnPage() {
  const { token } = useParams();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [done, setDone] = useState<Record<string, boolean>>({});
  const [ratings, setRatings] = useState<Record<string, number>>({});
  const storageKey = `learn-progress-${token}`;

  useEffect(() => {
    if (!FB_MODE) { setErr('Course access live app mein available hai.'); setLoading(false); return; }
    (async () => {
      try {
        const snap = await getDoc(doc(db(), 'courseLinks', token || ''));
        if (!snap.exists()) {
          setErr('Ye course link valid nahi hai. Teacher se naya link maango.');
          setLoading(false);
          return;
        }
        setData(snap.data());
        // progress: server + local merge (local wins for same lesson)
        let local: Record<string, boolean> = {};
        try { local = JSON.parse(localStorage.getItem(storageKey) || '{}'); } catch { /* ignore */ }
        const server = (snap.data()?.progress as Record<string, boolean>) || {};
        setDone({ ...server, ...local });
        setRatings((snap.data()?.ratings as Record<string, number>) || {});
      } catch {
        setErr('Course load nahi hua. Internet check karke retry karo.');
      } finally { setLoading(false); }
    })();
  }, [token]);

  if (loading) {
    return <Box sx={{ minHeight: '100vh', display: 'grid', placeItems: 'center' }}><CircularProgress /></Box>;
  }

  if (err) {
    return (
      <Box sx={{ minHeight: '100vh', display: 'grid', placeItems: 'center', p: 3, bgcolor: 'grey.100' }}>
        <Paper sx={{ p: 4, maxWidth: 420, textAlign: 'center' }}>
          <Typography variant="h6" fontWeight={800} gutterBottom>Course Access</Typography>
          <Typography color="text.secondary">{err}</Typography>
        </Paper>
      </Box>
    );
  }

  const items: Item[] = (data.items || []).slice().sort((a: Item, b: Item) => a.sortOrder - b.sortOrder);
  const folders: Folder[] = (data.folders || []).slice().sort((a: Folder, b: Folder) => a.sortOrder - b.sortOrder);
  const rootItems = items.filter((i) => !i.folderId);
  const folderItems = (fid: number) => items.filter((i) => i.folderId === fid);
  const topFolders = folders.filter((f) => !f.parentId);
  const doneCount = items.filter((i) => done[String(i.id)]).length;
  const pct = items.length ? Math.round((doneCount / items.length) * 100) : 0;

  const rate = async (id: number, stars: number) => {
    setRatings((r) => ({ ...r, [String(id)]: stars }));
    try { await post('/v2/course-links/rate', { token, itemId: id, stars }); } catch { /* ignore */ }
  };

  const avgRating = items.length
    ? (items.reduce((s, i) => s + (ratings[String(i.id)] || 0), 0) / items.length).toFixed(1)
    : '0.0';

  const toggleDone = async (id: number) => {
    const next: Record<string, boolean> = { ...done };
    if (next[String(id)]) delete next[String(id)];
    else next[String(id)] = true;
    setDone(next);
    try { localStorage.setItem(storageKey, JSON.stringify(next)); } catch { /* ignore */ }
    try {
      if (token) await updateDoc(doc(db(), 'courseLinks', token), { progress: next });
    } catch { /* ignore — local progress bhi chalta hai */ }
  };

  const renderItem = (it: Item) => (
    <Box key={it.id} sx={{ display: 'flex', alignItems: 'center', gap: 1.5, py: 1.25, flexWrap: 'wrap' }}>
      <Avatar sx={{ bgcolor: 'grey.100', color: 'text.primary', fontWeight: 800 }}>{typeIcon(it.type)}</Avatar>
      <Box sx={{ flexGrow: 1, minWidth: 0 }}>
        <Typography variant="body2" fontWeight={700} noWrap>{it.title}</Typography>
        <Typography variant="caption" color="text.secondary" noWrap display="block">
          {it.description || it.url || ''}
        </Typography>
      </Box>
      <Chip size="small" label={it.type} variant="outlined" />
      <Box sx={{ display: 'flex', gap: 0.25 }} title="रेटिंग दो">
        {[1, 2, 3, 4, 5].map((s) => (
          <Typography
            key={s} onClick={() => rate(it.id, s)}
            sx={{ cursor: 'pointer', fontSize: 16, lineHeight: 1, color: (ratings[String(it.id)] || 0) >= s ? 'warning.main' : 'grey.300' }}
          >
            ★
          </Typography>
        ))}
      </Box>
      <Button
        size="small"
        variant={done[String(it.id)] ? 'contained' : 'outlined'}
        color={done[String(it.id)] ? 'success' : 'primary'}
        startIcon={<CheckCircleIcon />}
        onClick={() => toggleDone(it.id)}
      >
        {done[String(it.id)] ? 'Done' : 'Mark done'}
      </Button>
      {it.url && (
        <Button size="small" variant="contained" endIcon={<OpenInNewIcon />} onClick={() => window.open(it.url, '_blank')}>
          Open
        </Button>
      )}
    </Box>
  );

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'grey.100', pb: 6 }}>
      <Box sx={{ bgcolor: 'primary.main', color: '#fff', px: 2, py: 4 }}>
        <Box sx={{ maxWidth: 760, mx: 'auto' }}>
          <Typography variant="overline" sx={{ opacity: 0.85 }}>{data.teacherName || 'Teacher'} · Apna Class Plus</Typography>
          <Typography variant="h4" fontWeight={900}>{data.courseTitle || 'Course'}</Typography>
          {data.studentName && (
            <Chip
              size="small" label={`For ${data.studentName}`}
              sx={{ mt: 1, bgcolor: 'rgba(255,255,255,0.22)', color: '#fff', fontWeight: 700 }}
            />
          )}
          {data.courseDescription && (
            <Typography sx={{ mt: 1, opacity: 0.92, maxWidth: 620 }}>{data.courseDescription}</Typography>
          )}
          <Typography variant="caption" sx={{ display: 'block', mt: 1.5, opacity: 0.8 }}>
            {items.length} lessons{data.price ? ` · ₹${data.price}` : ''}
          </Typography>
          {items.length > 0 && (
            <Box sx={{ mt: 1.5, display: 'flex', alignItems: 'center', gap: 2 }}>
              <Box sx={{ flexGrow: 1, bgcolor: 'rgba(255,255,255,0.25)', borderRadius: 1, height: 8, overflow: 'hidden' }}>
                <Box sx={{ width: `${pct}%`, height: '100%', bgcolor: '#fff', transition: 'width .3s' }} />
              </Box>
              <Typography variant="caption" fontWeight={800}>{pct}% · {doneCount}/{items.length} done · ★ {avgRating}</Typography>
            </Box>
          )}
        </Box>
      </Box>

      <Box sx={{ maxWidth: 760, mx: 'auto', p: 2 }}>
        <Typography variant="subtitle1" fontWeight={800} sx={{ mb: 1 }}>Course Content</Typography>

        {items.length === 0 && (
          <Paper sx={{ p: 3 }}>
            <Typography color="text.secondary">Teacher ne abhi is course mein content add nahi kiya.</Typography>
          </Paper>
        )}

        {rootItems.length > 0 && (
          <Card elevation={2} sx={{ mb: 2 }}>
            <CardContent>
              {rootItems.map((it, idx) => (
                <Box key={it.id}>
                  {idx > 0 && <Divider />}
                  {renderItem(it)}
                </Box>
              ))}
            </CardContent>
          </Card>
        )}

        {topFolders.map((f) => {
          const children = folderItems(f.id);
          return (
            <Card elevation={2} key={f.id} sx={{ mb: 2 }}>
              <CardContent>
                <Typography fontWeight={800} sx={{ mb: children.length ? 0.5 : 0 }}>📁 {f.name}</Typography>
                <Typography variant="caption" color="text.secondary">{children.length} lessons</Typography>
                {children.length > 0 && (
                  <Box sx={{ mt: 1 }}>
                    {children.map((it, idx) => (
                      <Box key={it.id}>
                        {idx > 0 && <Divider />}
                        {renderItem(it)}
                      </Box>
                    ))}
                  </Box>
                )}
              </CardContent>
            </Card>
          );
        })}

        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', textAlign: 'center', mt: 4 }}>
          Powered by Apna Class Plus
        </Typography>
      </Box>
    </Box>
  );
}
