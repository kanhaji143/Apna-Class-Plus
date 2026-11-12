import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Box, Button, Card, CardContent, Typography, TextField, Dialog, DialogTitle, DialogContent,
  DialogActions, MenuItem, Select, FormControl, InputLabel, Chip, IconButton,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import { get, post, del, put } from '../../api/client';

interface Question {
  id: number; question: string; option_a: string | null; option_b: string | null;
  option_c: string | null; option_d: string | null; correct: string; marks: number;
}
interface Attempt { id: number; student_name: string | null; student_phone: string | null; score: number; total: number; submitted_at: string; }
interface Test { id: number; title: string; description: string | null; duration_min: number; status: string; }

const OPTS = ['a', 'b', 'c', 'd'] as const;

export default function TestEditorPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [test, setTest] = useState<Test | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [attempts, setAttempts] = useState<Attempt[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({ question: '', a: '', b: '', c: '', d: '', correct: 'a', marks: 1 });

  const load = () => {
    get<{ test: Test; questions: Question[]; attempts: Attempt[] }>(`/v3/tests/${id}/full`)
      .then((d) => { setTest(d.test); setQuestions(d.questions); setAttempts(d.attempts); })
      .catch(() => {})
      .finally(() => setLoading(false));
  };
  useEffect(load, [id]);

  const addQuestion = async () => {
    if (!form.question.trim() || !form.a.trim() || !form.b.trim()) return;
    setCreating(true);
    try {
      await post(`/v3/tests/${id}/questions`, {
        question: form.question, optionA: form.a, optionB: form.b, optionC: form.c || null,
        optionD: form.d || null, correct: form.correct, marks: form.marks,
      });
      setOpen(false);
      setForm({ question: '', a: '', b: '', c: '', d: '', correct: 'a', marks: 1 });
      load();
    } finally { setCreating(false); }
  };

  const deleteQuestion = async (qid: number) => {
    if (!confirm('Question delete karna hai?')) return;
    await del(`/v3/tests/${id}/questions/${qid}`);
    load();
  };

  const saveTest = async () => {
    if (!test) return;
    await put(`/v3/tests/${id}`, { title: test.title, description: test.description, durationMin: test.duration_min });
    load();
  };

  const publish = async () => {
    try {
      await post(`/v3/tests/${id}/publish`, {});
      load();
    } catch (e: any) {
      alert(e?.response?.data?.message || 'Publish fail hua');
    }
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3, flexWrap: 'wrap' }}>
        <Button startIcon={<ArrowBackIcon />} onClick={() => navigate('/content/test-portal')}>Back</Button>
        <Typography variant="h5" fontWeight={800}>Test Editor</Typography>
        <Box sx={{ flexGrow: 1 }} />
        {test && <Chip label={test.status === 'published' ? '🟢 Published' : '⚪ Draft'}
          color={test.status === 'published' ? 'success' : 'default'} variant="outlined" />}
        {test && test.status !== 'published' && (
          <Button variant="contained" color="success" onClick={publish}>Publish</Button>
        )}
        {test && test.status === 'published' && (
          <Button variant="outlined" startIcon={<ContentCopyIcon />}
            onClick={() => { const u = `${location.origin}/test/${id}`; navigator.clipboard.writeText(u); alert('Public link:\n' + u); }}>
            Copy Public Link
          </Button>
        )}
      </Box>

      {loading ? <Typography color="text.secondary">Loading…</Typography> : test && (
        <>
          {/* Test details */}
          <Card elevation={2} sx={{ mb: 3 }}>
            <CardContent sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
              <TextField label="Title" value={test.title} fullWidth sx={{ flex: '1 1 260px' }}
                onChange={(e) => setTest({ ...test, title: e.target.value })} />
              <TextField label="Description" value={test.description || ''} fullWidth sx={{ flex: '1 1 260px' }}
                onChange={(e) => setTest({ ...test, description: e.target.value })} />
              <TextField label="Duration (min)" type="number" value={test.duration_min} sx={{ width: 140 }}
                onChange={(e) => setTest({ ...test, duration_min: Number(e.target.value) })} />
              <Button variant="outlined" onClick={saveTest} sx={{ alignSelf: 'center' }}>Save Details</Button>
            </CardContent>
          </Card>

          {/* Questions */}
          <Card elevation={2} sx={{ mb: 3 }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <Typography variant="subtitle1" fontWeight={800} sx={{ flexGrow: 1 }}>Questions ({questions.length})</Typography>
                <Button size="small" variant="contained" startIcon={<AddIcon />} onClick={() => setOpen(true)}>Add Question</Button>
              </Box>
              {questions.length === 0 && <Typography color="text.secondary">Koi question nahi — publish se pehle add karo.</Typography>}
              {questions.map((q, i) => (
                <Box key={q.id} sx={{ display: 'flex', alignItems: 'center', gap: 1, p: 1, mb: 1, borderRadius: 1, border: '1px solid', borderColor: 'divider' }}>
                  <Typography sx={{ width: 28, fontWeight: 800 }}>{i + 1}.</Typography>
                  <Box sx={{ flexGrow: 1 }}>
                    <Typography variant="body2" fontWeight={700}>{q.question}</Typography>
                    <Typography variant="caption" color="text.secondary">
                      {OPTS.map((o) => `(${o}) ${q[`option_${o}` as keyof Question] ?? '-'} `).join('  ')}
                    </Typography>
                  </Box>
                  <Chip size="small" label={`✓ ${q.correct.toUpperCase()} · ${q.marks}m`} color="primary" variant="outlined" />
                  <IconButton size="small" color="error" onClick={() => deleteQuestion(q.id)}><DeleteIcon fontSize="small" /></IconButton>
                </Box>
              ))}
            </CardContent>
          </Card>

          {/* Results */}
          <Card elevation={2}>
            <CardContent>
              <Typography variant="subtitle1" fontWeight={800} sx={{ mb: 1 }}>Student Results ({attempts.length})</Typography>
              {attempts.length === 0 && <Typography color="text.secondary">Abhi koi attempt nahi hua.</Typography>}
              {attempts.map((a) => (
                <Box key={a.id} sx={{ display: 'flex', justifyContent: 'space-between', py: 1, borderBottom: '1px solid', borderColor: 'divider' }}>
                  <Typography variant="body2">{a.student_name || 'Anonymous'} · {a.student_phone || '-'}</Typography>
                  <Chip size="small" label={`${a.score}/${a.total}`} color={a.score / Math.max(a.total, 1) >= 0.5 ? 'success' : 'warning'} />
                </Box>
              ))}
            </CardContent>
          </Card>
        </>
      )}

      {/* Add question dialog */}
      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Add MCQ Question</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, pt: 2 }}>
          <TextField label="Question" multiline rows={2} value={form.question} onChange={(e) => setForm({ ...form, question: e.target.value })} fullWidth />
          {(['a', 'b', 'c', 'd'] as const).map((o) => (
            <TextField key={o} label={`Option (${o})${o === 'c' || o === 'd' ? ' — optional' : ''}`}
              value={form[o]} onChange={(e) => setForm({ ...form, [o]: e.target.value })} fullWidth />
          ))}
          <Box sx={{ display: 'flex', gap: 2 }}>
            <FormControl sx={{ width: 120 }}>
              <InputLabel>Correct</InputLabel>
              <Select label="Correct" value={form.correct} onChange={(e) => setForm({ ...form, correct: e.target.value })}>
                {OPTS.map((o) => <MenuItem key={o} value={o}>{o.toUpperCase()}</MenuItem>)}
              </Select>
            </FormControl>
            <TextField label="Marks" type="number" value={form.marks} sx={{ width: 120 }}
              onChange={(e) => setForm({ ...form, marks: Number(e.target.value) })} />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>Cancel</Button>
          <Button variant="contained" disabled={!form.question.trim() || !form.a.trim() || !form.b.trim() || creating} onClick={addQuestion}>
            {creating ? 'Adding…' : 'Add'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
