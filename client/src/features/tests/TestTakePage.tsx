import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import {
  Box, Button, Card, CardContent, Typography, Radio, RadioGroup, FormControlLabel,
  FormControl, LinearProgress, TextField, Chip,
} from '@mui/material';
import axios from 'axios';

/**
 * PUBLIC student-facing test page (/test/:id) — original Classplus test-taking flow.
 * No auth — koi bhi student link se test de sakta hai. Auto-score server pe hota hai.
 */
interface PubQuestion { id: number; question: string; option_a: string | null; option_b: string | null; option_c: string | null; option_d: string | null; marks: number; }
interface Review { given: string | null; correct: string; ok: boolean; }

export default function TestTakePage() {
  const { id } = useParams();
  const [test, setTest] = useState<any>(null);
  const [questions, setQuestions] = useState<PubQuestion[]>([]);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [started, setStarted] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(0);
  const [result, setResult] = useState<{ score: number; total: number; review: Record<string, Review> } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    axios.get(`/public/test/${id}`)
      .then((r) => { setTest(r.data.data.test); setQuestions(r.data.data.questions); })
      .catch((e) => setError(e?.response?.data?.message || 'Test load nahi hua'));
  }, [id]);

  // countdown
  useEffect(() => {
    if (!started || result || secondsLeft <= 0) return;
    const t = setInterval(() => setSecondsLeft((s) => s - 1), 1000);
    return () => clearInterval(t);
  }, [started, result, secondsLeft]);

  const timeUp = started && !result && secondsLeft <= 0;

  const submit = async () => {
    if (submitting) return;
    setSubmitting(true);
    try {
      const r = await axios.post(`/public/test/${id}/submit`, { studentName: name, studentPhone: phone, answers });
      setResult(r.data.data);
    } catch (e: any) {
      setError(e?.response?.data?.message || 'Submit fail hua');
    } finally { setSubmitting(false); }
  };

  useEffect(() => { if (timeUp) submit(); }, [timeUp]); // eslint-disable-line

  const answeredCount = Object.keys(answers).length;
  const progress = useMemo(() => questions.length ? (answeredCount / questions.length) * 100 : 0, [answeredCount, questions]);

  const fmt = (s: number) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;

  if (error) {
    return <Box sx={{ minHeight: '100vh', display: 'grid', placeItems: 'center', bgcolor: '#F7F8FC' }}>
      <Typography>😕 {error}</Typography>
    </Box>;
  }

  if (!test) {
    return <Box sx={{ minHeight: '100vh', display: 'grid', placeItems: 'center', bgcolor: '#F7F8FC' }}>
      <Typography color="text.secondary">Loading test…</Typography>
    </Box>;
  }

  // ----- Result view -----
  if (result) {
    const pct = Math.round((result.score / Math.max(result.total, 1)) * 100);
    return (
      <Box sx={{ minHeight: '100vh', bgcolor: '#F7F8FC', p: 3 }}>
        <Box sx={{ maxWidth: 640, mx: 'auto' }}>
          <Card elevation={3}>
            <CardContent sx={{ textAlign: 'center', py: 4 }}>
              <Typography variant="h2" fontWeight={900}>{pct >= 50 ? '🎉' : '💪'}</Typography>
              <Typography variant="h4" fontWeight={900} sx={{ my: 1 }}>{result.score} / {result.total}</Typography>
              <Chip size="medium" label={`${pct}%`} color={pct >= 50 ? 'success' : 'warning'} />
              <Typography color="text.secondary" sx={{ mt: 1 }}>{test.title}</Typography>
            </CardContent>
          </Card>
          <Typography variant="h6" fontWeight={800} sx={{ mt: 3, mb: 1 }}>Answer Review</Typography>
          {questions.map((q, i) => {
            const rv = result.review[q.id];
            return (
              <Card key={q.id} elevation={1} sx={{ mb: 1 }}>
                <CardContent sx={{ py: 1.5 }}>
                  <Typography variant="body2" fontWeight={700}>{i + 1}. {q.question}</Typography>
                  <Typography variant="caption" color={rv?.ok ? 'success.main' : 'error.main'}>
                    {rv?.ok ? '✅ Correct' : `❌ Tumhara jawab: ${rv?.given ? rv.given.toUpperCase() : '—'} · Sahi: ${rv?.correct.toUpperCase()}`}
                  </Typography>
                </CardContent>
              </Card>
            );
          })}
        </Box>
      </Box>
    );
  }

  // ----- Start screen -----
  if (!started) {
    return (
      <Box sx={{ minHeight: '100vh', display: 'grid', placeItems: 'center', bgcolor: '#F7F8FC', p: 3 }}>
        <Card elevation={3} sx={{ maxWidth: 420, width: '100%', textAlign: 'center' }}>
          <CardContent sx={{ py: 4 }}>
            <Typography variant="h3">📝</Typography>
            <Typography variant="h5" fontWeight={900} sx={{ mt: 1 }}>{test.title}</Typography>
            {test.description && <Typography color="text.secondary" sx={{ mt: 1 }}>{test.description}</Typography>}
            <Typography sx={{ mt: 2 }}>⏱ {test.duration_min} min · 📝 {questions.length} questions</Typography>
            <TextField label="Aapka naam" value={name} onChange={(e) => setName(e.target.value)} fullWidth sx={{ mt: 3 }} />
            <TextField label="Phone (optional)" value={phone} onChange={(e) => setPhone(e.target.value)} fullWidth sx={{ mt: 1 }} />
            <Button variant="contained" size="large" fullWidth sx={{ mt: 3, fontWeight: 800 }} onClick={() => { setStarted(true); setSecondsLeft(test.duration_min * 60); }}>
              Start Test
            </Button>
          </CardContent>
        </Card>
      </Box>
    );
  }

  // ----- Test taking -----
  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#F7F8FC', p: { xs: 1, sm: 3 } }}>
      <Box sx={{ maxWidth: 720, mx: 'auto' }}>
        <Card elevation={2} sx={{ mb: 2, position: 'sticky', top: 8, zIndex: 5 }}>
          <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2, py: 1.5 }}>
            <Typography fontWeight={800} sx={{ flexGrow: 1 }}>{test.title}</Typography>
            <Chip label={`⏱ ${fmt(Math.max(secondsLeft, 0))}`} color={secondsLeft < 60 ? 'error' : 'primary'} />
          </CardContent>
          <LinearProgress variant="determinate" value={progress} />
        </Card>

        {questions.map((q, i) => (
          <Card key={q.id} elevation={1} sx={{ mb: 1.5 }}>
            <CardContent>
              <Typography variant="body1" fontWeight={700}>{i + 1}. {q.question} <Chip size="small" label={`${q.marks}m`} sx={{ ml: 1 }} /></Typography>
              <FormControl sx={{ mt: 1 }}>
                <RadioGroup
                  value={answers[q.id] || ''}
                  onChange={(e) => setAnswers({ ...answers, [q.id]: e.target.value })}
                >
                  {(['a', 'b', 'c', 'd'] as const).filter((o) => q[`option_${o}`]).map((o) => (
                    <FormControlLabel key={o} value={o} control={<Radio size="small" />} label={`(${o}) ${q[`option_${o}`]}`} />
                  ))}
                </RadioGroup>
              </FormControl>
            </CardContent>
          </Card>
        ))}

        <Button variant="contained" size="large" fullWidth sx={{ mb: 4, fontWeight: 800 }}
          disabled={submitting} onClick={submit}>
          {submitting ? 'Submitting…' : `Submit Test (${answeredCount}/${questions.length} answered)`}
        </Button>
      </Box>
    </Box>
  );
}
