import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import {
  Box, Typography, Card, CardContent, Button, TextField, Radio, RadioGroup, FormControlLabel, CircularProgress, Paper,
} from '@mui/material';
import { FB_MODE } from '../../firebase/fb';

/**
 * PUBLIC survey page — student bina login vote kar sakta hai.
 * (FB_MODE mein fbRouter public survey routes use karta hai.)
 */
export default function PublicSurveyPage() {
  const { id } = useParams();
  const [survey, setSurvey] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [answer, setAnswer] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (!FB_MODE) { setErr('Survey live app mein available hai.'); setLoading(false); return; }
    (async () => {
      try {
        const { route } = await import('../../firebase/fbRouter');
        const d = await route('GET', '/public/survey/' + id);
        setSurvey(d);
      } catch (e: any) {
        setErr('Survey load nahi hua (ya inactive hai).');
      } finally { setLoading(false); }
    })();
  }, [id]);

  const submit = async () => {
    if (!answer) return;
    setSubmitting(true);
    try {
      const { route } = await import('../../firebase/fbRouter');
      await route('POST', '/public/survey/' + id + '/respond', { answer, studentName: name });
      setDone(true);
    } catch { setErr('Submit nahi hua — dobara try karo.'); }
    finally { setSubmitting(false); }
  };

  if (loading) return <Box sx={{ minHeight: '100vh', display: 'grid', placeItems: 'center' }}><CircularProgress /></Box>;
  if (err) return <Box sx={{ minHeight: '100vh', display: 'grid', placeItems: 'center', p: 3, bgcolor: 'grey.100' }}><Paper sx={{ p: 4, maxWidth: 420, textAlign: 'center' }}><Typography variant="h6" gutterBottom>Survey</Typography><Typography color="text.secondary">{err}</Typography></Paper></Box>;
  if (done) return <Box sx={{ minHeight: '100vh', display: 'grid', placeItems: 'center', p: 3, bgcolor: 'grey.100' }}><Paper sx={{ p: 4, maxWidth: 420, textAlign: 'center' }}><Typography variant="h3">🎉</Typography><Typography variant="h6" fontWeight={800} sx={{ mt: 1 }}>Dhanyavaad!</Typography><Typography color="text.secondary">Aapka response record ho gaya.</Typography></Paper></Box>;

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#F7F8FC', p: { xs: 2, sm: 3 } }}>
      <Box sx={{ maxWidth: 640, mx: 'auto' }}>
        <Typography variant="overline" color="primary" fontWeight={800}>Apna Class Plus · Survey</Typography>
        <Typography variant="h4" fontWeight={900} sx={{ mb: 2 }}>{survey?.title}</Typography>
        <Card elevation={3}>
          <CardContent>
            <Typography variant="body1" fontWeight={700} sx={{ mb: 2 }}>{survey?.question}</Typography>
            <RadioGroup value={answer} onChange={(e) => setAnswer(e.target.value)}>
              {(survey?.options || []).map((o: string) => (
                <FormControlLabel key={o} value={o} control={<Radio />} label={o} />
              ))}
            </RadioGroup>
            <TextField label="Aapka naam (optional)" value={name} onChange={(e) => setName(e.target.value)} fullWidth sx={{ mt: 2 }} />
            <Button variant="contained" size="large" fullWidth sx={{ mt: 2, fontWeight: 800 }} disabled={!answer || submitting} onClick={submit}>
              {submitting ? 'Submitting…' : 'Submit'}
            </Button>
          </CardContent>
        </Card>
      </Box>
    </Box>
  );
}
