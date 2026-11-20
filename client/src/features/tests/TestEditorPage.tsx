import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Box, Button, Card, CardContent, Typography, TextField, Dialog, DialogTitle, DialogContent,
  DialogActions, MenuItem, Select, FormControl, InputLabel, Chip, IconButton, Tabs, Tab,
  Switch, FormControlLabel,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import FolderIcon from '@mui/icons-material/Folder';
import GradeIcon from '@mui/icons-material/Grade';
import { get, post, del, put } from '../../api/client';

interface Question {
  id: number; section_id: number | null; parent_id?: number | null; type: string; question: string; question_hi?: string | null;
  option_a: string | null; option_b: string | null; option_c: string | null; option_d: string | null;
  correct: string; accepted_answers: string | null; explanation: string | null;
  marks: number; sort_order: number;
}
interface Section { id: number; name: string; sort_order: number; }
interface Attempt {
  id: number; student_name: string | null; student_phone: string | null;
  answers: Record<string, string>; manual: Record<string, number>; time: Record<string, number>;
  score: number; total: number; graded: number; rated: number; submitted_at: string;
}
interface Test {
  id: number; title: string; description: string | null; duration_min: number;
  status: string; reattempt_mode: number;
}

const Q_TYPES = [
  { value: 'comprehension', label: 'Comprehension (passage + sub-questions)', icon: '📖' },
  { value: 'mcq', label: 'MCQ (single correct)', icon: 'ðŸ”˜' },
  { value: 'truefalse', label: 'True / False', icon: 'âœ…' },
  { value: 'objective', label: 'Objective (short answer)', icon: 'âœï¸' },
  { value: 'subjective', label: 'Subjective (long answer)', icon: 'ðŸ“' },
];
const typeIcon = (t: string) => Q_TYPES.find((x) => x.value === t)?.icon ?? 'â“';
const OPTS = ['a', 'b', 'c', 'd'] as const;

const blankForm = { type: 'mcq', question: '', a: '', b: '', c: '', d: '', correct: 'a', marks: 1, explanation: '', sectionId: '', parentId: '', accepted: '', qHi: '', aHi: '', bHi: '', cHi: '', dHi: '', explHi: '' };

export default function TestEditorPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [test, setTest] = useState<Test | null>(null);
  const [sections, setSections] = useState<Section[]>([]);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [attempts, setAttempts] = useState<Attempt[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState(0); // 0=Questions, 1=Results/Grading
  const [open, setOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState(blankForm);
  const [sectionOpen, setSectionOpen] = useState(false);
  const [sectionName, setSectionName] = useState('');
  const [grading, setGrading] = useState<Record<number, Record<number, number>>>({}); // attemptId -> qid -> marks
  const [bulkOpen, setBulkOpen] = useState(false);
  const [bulkText, setBulkText] = useState('');
  const [bulkPreview, setBulkPreview] = useState<any[] | null>(null);
  const [bulkBusy, setBulkBusy] = useState(false);
  const [qLang, setQLang] = useState(0); // 0=English, 1=Hindi (dialog tabs)
  const [leaderboard, setLeaderboard] = useState<any[] | null>(null);

  const load = () => {
    get<{ test: Test; sections: Section[]; questions: Question[]; attempts: Attempt[] }>(`/v3/tests/${id}/full`)
      .then((d) => { setTest(d.test); setSections(d.sections); setQuestions(d.questions); setAttempts(d.attempts); })
      .catch(() => {})
      .finally(() => setLoading(false));
  };
  useEffect(() => { load(); }, [id]);

  useEffect(() => {
    if (tab !== 1) return;
    get<{ top: any[] }>(`/public/test/${id}/leaderboard`)
      .then((d) => setLeaderboard(d.top || []))
      .catch(() => setLeaderboard([]));
  }, [tab, id]);

  const addQuestion = async () => {
    if (!form.question.trim()) return;
    setCreating(true);
    try {
      const body: any = {
        question: form.question, type: form.type, marks: form.type === 'comprehension' ? 0 : form.marks,
        explanation: form.explanation || undefined,
        sectionId: form.sectionId ? Number(form.sectionId) : undefined,
        parentId: form.parentId ? Number(form.parentId) : undefined,
        questionHi: form.qHi || undefined, explanationHi: form.explHi || undefined,
      };
      if (form.type === 'mcq') {
        body.optionA = form.a; body.optionB = form.b; body.optionC = form.c || undefined; body.optionD = form.d || undefined;
        body.correct = form.correct;
        if (form.aHi) body.optionAHi = form.aHi; if (form.bHi) body.optionBHi = form.bHi;
        if (form.cHi) body.optionCHi = form.cHi; if (form.dHi) body.optionDHi = form.dHi;
      } else if (form.type === 'truefalse') {
        body.correct = form.correct; // 'a' (True) | 'b' (False)
      } else if (form.type === 'objective') {
        body.acceptedAnswers = form.accepted.split(',').map((s) => s.trim()).filter(Boolean);
      } // subjective: sirf question + marks
      await post(`/v3/tests/${id}/questions`, body);
      setOpen(false);
      setForm(blankForm);
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
    await put(`/v3/tests/${id}`, {
      title: test.title, description: test.description, durationMin: test.duration_min,
      reattemptMode: !!test.reattempt_mode,
    });
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

  const addSection = async () => {
    if (!sectionName.trim()) return;
    await post(`/v3/tests/${id}/sections`, { name: sectionName });
    setSectionOpen(false); setSectionName('');
    load();
  };

  const deleteSection = async (sid: number) => {
    if (!confirm('Section delete? Questions ungrouped ho jayenge.')) return;
    await del(`/v3/tests/${id}/sections/${sid}`);
    load();
  };

  const gradeAttempt = async (att: Attempt) => {
    const scores = grading[att.id] || att.manual || {};
    try {
      await post(`/v3/attempts/${att.id}/grade`, { scores });
      load();
    } catch (e: any) { alert(e?.response?.data?.message || 'Grading fail'); }
  };

  // ---------- Bulk import (docx format paste) ----------
  const bulkParse = async () => {
    if (!bulkText.trim()) return;
    setBulkBusy(true);
    try {
      const r = await post<any[]>(`/v3/tests/${id}/import-parse`, { text: bulkText });
      setBulkPreview(r);
    } catch (e: any) { alert(e?.response?.data?.message || 'Parse fail hua'); }
    finally { setBulkBusy(false); }
  };
  const bulkImport = async () => {
    if (!bulkPreview?.length) return;
    setBulkBusy(true);
    try {
      const r = await post<{ inserted: number }>(`/v3/tests/${id}/import`, { questions: bulkPreview });
      alert(`${r.inserted} questions import ho gaye!`);
      setBulkOpen(false); setBulkText(''); setBulkPreview(null);
      load();
    } catch (e: any) { alert(e?.response?.data?.message || 'Import fail hua'); }
    finally { setBulkBusy(false); }
  };

  const sectionNameOf = (sid: number | null) => sections.find((s) => s.id === sid)?.name || 'â€”';
  const passages = questions.filter((q) => q.type === 'comprehension');

  const pendingSubj = (att: Attempt) =>
    questions.filter((q) => q.type === 'subjective' && att.manual[q.id] === undefined);

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2, flexWrap: 'wrap' }}>
        <Button startIcon={<ArrowBackIcon />} onClick={() => navigate('/content/test-portal')}>Back</Button>
        <Typography variant="h5" fontWeight={800}>Test Editor</Typography>
        <Box sx={{ flexGrow: 1 }} />
        {test && <Chip label={test.status === 'published' ? 'ðŸŸ¢ Published' : 'âšª Draft'}
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

      {loading ? <Typography color="text.secondary">Loadingâ€¦</Typography> : test && (
        <>
          {/* Test details */}
          <Card elevation={2} sx={{ mb: 2 }}>
            <CardContent sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
              <TextField label="Title" value={test.title} sx={{ flex: '1 1 240px' }}
                onChange={(e) => setTest({ ...test, title: e.target.value })} />
              <TextField label="Description" value={test.description || ''} sx={{ flex: '1 1 240px' }}
                onChange={(e) => setTest({ ...test, description: e.target.value })} />
              <TextField label="Duration (min)" type="number" value={test.duration_min} sx={{ width: 130 }}
                onChange={(e) => setTest({ ...test, duration_min: Number(e.target.value) })} />
              <Button variant="outlined" onClick={saveTest}>Save Details</Button>
              <FormControlLabel
                control={<Switch checked={!!test.reattempt_mode} onChange={(e) => setTest({ ...test, reattempt_mode: e.target.checked ? 1 : 0 })} />}
                label="Re-attempt Mode (View Solution during test)"
                sx={{ ml: 1 }}
              />
            </CardContent>
          </Card>

          {/* Sections */}
          <Card elevation={2} sx={{ mb: 2 }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <Typography variant="subtitle1" fontWeight={800} sx={{ flexGrow: 1 }}>
                  <FolderIcon fontSize="small" sx={{ verticalAlign: 'middle', mr: 0.5 }} />Sections ({sections.length})
                </Typography>
                <Button size="small" startIcon={<AddIcon />} onClick={() => setSectionOpen(true)}>Add Section</Button>
              </Box>
              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                {sections.length === 0 && <Typography variant="body2" color="text.secondary">No sections â€” sab questions ungrouped (optional).</Typography>}
                {sections.map((s) => (
                  <Chip key={s.id} label={`${s.name} (${questions.filter((q) => q.section_id === s.id).length})`}
                    onDelete={() => deleteSection(s.id)} variant="outlined" color="primary" />
                ))}
              </Box>
            </CardContent>
          </Card>

          {/* Tabs: Questions | Results & Grading */}
          <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
            <Tabs value={tab} onChange={(_, v) => setTab(v)}>
              <Tab label={`Questions (${questions.length})`} />
              <Tab label={`Results & Grading (${attempts.length})`} icon={<GradeIcon fontSize="small" />} iconPosition="start" />
            </Tabs>
          </Box>

          {tab === 0 && (
            <Card elevation={2}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <Typography variant="subtitle1" fontWeight={800} sx={{ flexGrow: 1 }}>Questions</Typography>
                  <Button size="small" sx={{ mr: 1 }} onClick={() => { setBulkPreview(null); setBulkOpen(true); }}>Bulk Import</Button>
                  <Button size="small" variant="contained" startIcon={<AddIcon />} onClick={() => setOpen(true)}>Add Question</Button>
                </Box>
                {questions.length === 0 && <Typography color="text.secondary">Koi question nahi â€” publish se pehle add karo.</Typography>}
                {(() => {
                  const answerable = questions.filter((qq) => qq.type !== 'comprehension');
                  const numOf = (qid: number) => answerable.findIndex((qq) => qq.id === qid) + 1;
                  const renderRow = (q: Question, num: number) => (
                    <Box key={q.id} sx={{ display: 'flex', alignItems: 'center', gap: 1, p: 1, mb: 1, borderRadius: 1, border: '1px solid', borderColor: 'divider', flexWrap: 'wrap' }}>
                      <Typography sx={{ width: 28, fontWeight: 800 }}>{num}.</Typography>
                      <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                        <Typography variant="body2" fontWeight={700}>{q.question}</Typography>
                        <Typography variant="caption" color="text.secondary">
                          {q.type === 'mcq' && OPTS.map((o) => `(${o}) ${q[`option_${o}` as keyof Question] ?? '-'} `).join('  ')}
                          {q.type === 'truefalse' && '(True / False)'}
                          {q.type === 'objective' && `Accepted: ${q.accepted_answers}`}
                          {q.type === 'subjective' && '(teacher grading)'}
                          {q.section_id ? ` Â· ðŸ“ ${sectionNameOf(q.section_id)}` : ''}
                          {q.parent_id ? ' Â· ðŸ“– Passage' : ''}
                          {q.question_hi ? ' Â· ðŸŒ à¤¹à¤¿à¤‚à¤¦à¥€' : ''}
                        </Typography>
                        {q.explanation && <Typography variant="caption" color="info.main" sx={{ display: 'block' }}>ðŸ’¡ {q.explanation}</Typography>}
                      </Box>
                      <Chip size="small" variant="outlined" label={q.type} />
                      {q.type !== 'subjective' && q.correct && <Chip size="small" label={`âœ“ ${q.correct.toUpperCase()}`} color="primary" variant="outlined" />}
                      <Chip size="small" label={`${q.marks}m`} variant="outlined" />
                      <IconButton size="small" color="error" onClick={() => deleteQuestion(q.id)}><DeleteIcon fontSize="small" /></IconButton>
                    </Box>
                  );
                  return questions.map((q) => {
                    if (q.type === 'comprehension') {
                      const children = questions.filter((c) => c.parent_id === q.id);
                      return (
                        <Box key={q.id} sx={{ mb: 1 }}>
                          <Box sx={{ p: 1.5, borderRadius: 1, border: '1px solid', borderColor: 'primary.light', bgcolor: 'primary.lighter' }}>
                            <Typography variant="body2" fontWeight={800}>ðŸ“– Passage: {q.question}</Typography>
                            <Typography variant="caption" color="text.secondary">
                              {children.length} sub-questions Â· marks 0 {q.question_hi ? 'Â· ðŸŒ à¤¹à¤¿à¤‚à¤¦à¥€' : ''}
                            </Typography>
                          </Box>
                          {children.length === 0 && (
                            <Typography variant="caption" color="warning.main" sx={{ display: 'block', pl: 1, py: 0.5 }}>
                              Abhi koi sub-question nahi â€” "Add Question" se Passage select karke add karo.
                            </Typography>
                          )}
                          {children.map((c) => renderRow(c, numOf(c.id)))}
                          <Box sx={{ textAlign: 'right', mt: 0.5 }}>
                            <IconButton size="small" color="error" onClick={() => deleteQuestion(q.id)}><DeleteIcon fontSize="small" /></IconButton>
                          </Box>
                        </Box>
                      );
                    }
                    if (q.parent_id) return null; // passage ke neeche render hota hai
                    return renderRow(q, numOf(q.id));
                  });
                })()}
              </CardContent>
            </Card>
          )}

          {tab === 1 && (
            <Card elevation={2}>
              <CardContent>
                {leaderboard && leaderboard.length > 0 && (
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="subtitle2" fontWeight={800} sx={{ mb: 0.5 }}>🏆 Leaderboard (Top 10)</Typography>
                    {leaderboard.slice(0, 10).map((r: any) => (
                      <Box key={r.id} sx={{ display: 'flex', gap: 2, py: 0.5, borderBottom: '1px solid', borderColor: 'divider' }}>
                        <Typography fontWeight={800} sx={{ width: 36 }}>#{r.rank}</Typography>
                        <Typography sx={{ flexGrow: 1 }}>{r.studentName}</Typography>
                        <Typography fontWeight={800}>{r.score}/{r.total}</Typography>
                      </Box>
                    ))}
                  </Box>
                )}
                <Typography variant="subtitle1" fontWeight={800} sx={{ mb: 1 }}>Student Results ({attempts.length})</Typography>
                {attempts.length === 0 && <Typography color="text.secondary">Abhi koi attempt nahi hua.</Typography>}
                {attempts.map((a) => (
                  <Box key={a.id} sx={{ p: 1.5, mb: 1.5, borderRadius: 1, border: '1px solid', borderColor: 'divider' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                      <Typography variant="body2" fontWeight={700} sx={{ flexGrow: 1 }}>
                        {a.student_name || 'Anonymous'} Â· {a.student_phone || '-'} Â· {a.submitted_at}
                      </Typography>
                      {a.rated > 0 && <Chip size="small" label={'â­'.repeat(a.rated)} variant="outlined" />}
                      <Chip size="small" label={`${a.score}/${a.total}`}
                        color={a.graded ? 'success' : 'warning'} variant="outlined" />
                      {!a.graded && <Chip size="small" label="grading pending" color="warning" />}
                    </Box>
                    {/* Subjective answers grading */}
                    {pendingSubj(a).length > 0 && (
                      <Box sx={{ mt: 1, pl: 1, borderLeft: '3px solid', borderColor: 'warning.light' }}>
                        {pendingSubj(a).map((q) => (
                          <Box key={q.id} sx={{ display: 'flex', alignItems: 'center', gap: 1, py: 0.5, flexWrap: 'wrap' }}>
                            <Typography variant="caption" sx={{ flex: '1 1 300px' }}>
                              <b>{typeIcon(q.type)} {q.question}</b>: "{a.answers[q.id] || 'â€”'}"
                            </Typography>
                            <TextField size="small" type="number" label={`/${q.marks}`} sx={{ width: 90 }}
                              value={grading[a.id]?.[q.id] ?? ''}
                              onChange={(e) => setGrading({
                                ...grading,
                                [a.id]: { ...(grading[a.id] || {}), [q.id]: Number(e.target.value) },
                              })} />
                          </Box>
                        ))}
                        <Button size="small" variant="contained" color="success" sx={{ mt: 1 }}
                          onClick={() => gradeAttempt(a)}>Save Grades</Button>
                      </Box>
                    )}
                    {a.graded > 0 && pendingSubj(a).length === 0 && (
                      <Typography variant="caption" color="success.main">âœ… Graded â€” subjective marks: {Object.values(a.manual).join(', ') || 'â€”'}</Typography>
                    )}
                  </Box>
                ))}
              </CardContent>
            </Card>
          )}
        </>
      )}

      {/* Add question dialog â€” type-aware */}
      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Add Question</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, pt: 2 }}>
          <FormControl fullWidth>
            <InputLabel>Question Type</InputLabel>
            <Select label="Question Type" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
              {Q_TYPES.map((t) => <MenuItem key={t.value} value={t.value}>{t.icon} {t.label}</MenuItem>)}
            </Select>
          </FormControl>
          {sections.length > 0 && (
            <FormControl fullWidth>
              <InputLabel>Section</InputLabel>
              <Select label="Section" value={form.sectionId} onChange={(e) => setForm({ ...form, sectionId: e.target.value })}>
                <MenuItem value="">â€” Ungrouped â€”</MenuItem>
                {sections.map((s) => <MenuItem key={s.id} value={s.id}>{s.name}</MenuItem>)}
              </Select>
            </FormControl>
          )}
          {form.type !== 'comprehension' && passages.length > 0 && (
            <FormControl fullWidth>
              <InputLabel>Passage (Comprehension)</InputLabel>
              <Select label="Passage (Comprehension)" value={form.parentId} onChange={(e) => setForm({ ...form, parentId: e.target.value })}>
                <MenuItem value="">â€” Ungrouped â€”</MenuItem>
                {passages.map((p) => <MenuItem key={p.id} value={p.id}>ðŸ“– {String(p.question).slice(0, 50)}</MenuItem>)}
              </Select>
            </FormControl>
          )}
          <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
            <Tabs value={qLang} onChange={(_, v: number) => setQLang(v)}>
              <Tab label="English" /><Tab label="à¤¹à¤¿à¤‚à¤¦à¥€" />
            </Tabs>
          </Box>

          {qLang === 0 ? (<>
            <TextField label={form.type === 'comprehension' ? 'Passage (English)' : 'Question'}
              multiline rows={form.type === 'comprehension' ? 5 : 2} value={form.question}
              onChange={(e) => setForm({ ...form, question: e.target.value })} fullWidth />
            {form.type === 'comprehension' && (
              <Typography variant="caption" color="text.secondary">
                ðŸ“– Ye passage container hai (marks 0). Sub-questions alag se add karo aur "Passage (Comprehension)" select karo.
              </Typography>
            )}

            {form.type === 'mcq' && (<>
              {(['a', 'b', 'c', 'd'] as const).map((o) => (
                <TextField key={o} label={`Option (${o})${o === 'c' || o === 'd' ? ' â€” optional' : ''}`}
                  value={form[o]} onChange={(e) => setForm({ ...form, [o]: e.target.value })} fullWidth />
              ))}
              <FormControl sx={{ width: 140 }}>
                <InputLabel>Correct</InputLabel>
                <Select label="Correct" value={form.correct} onChange={(e) => setForm({ ...form, correct: e.target.value })}>
                  {OPTS.map((o) => <MenuItem key={o} value={o}>{o.toUpperCase()}</MenuItem>)}
                </Select>
              </FormControl>
            </>)}

            {form.type === 'truefalse' && (
              <FormControl sx={{ width: 180 }}>
                <InputLabel>Correct Answer</InputLabel>
                <Select label="Correct Answer" value={form.correct} onChange={(e) => setForm({ ...form, correct: e.target.value })}>
                  <MenuItem value="a">True</MenuItem>
                  <MenuItem value="b">False</MenuItem>
                </Select>
              </FormControl>
            )}

            {form.type === 'objective' && (
              <TextField label="Accepted answers (comma separated)" placeholder="h2o, H2O, water"
                value={form.accepted} onChange={(e) => setForm({ ...form, accepted: e.target.value })}
                helperText="Case-insensitive exact match. Multiple valid answers allowed." fullWidth />
            )}

            {form.type === 'subjective' && (
              <Typography variant="caption" color="text.secondary">
                ðŸ“ Subjective: student long text likhega, score aap "Results & Grading" tab mein manually denge.
              </Typography>
            )}

            <TextField label="Explanation (View Solution ke liye)" multiline rows={2}
              value={form.explanation} onChange={(e) => setForm({ ...form, explanation: e.target.value })} fullWidth />
          </>) : (<>
            <Button size="small" variant="outlined" sx={{ mb: 1 }} onClick={() => setForm((f: any) => ({
              ...f,
              qHi: f.qHi || f.question,
              aHi: f.aHi || f.a,
              bHi: f.bHi || f.b,
              cHi: f.cHi || f.c,
              dHi: f.dHi || f.d,
              explanationHi: f.explanationHi || f.explanation,
            }))}>
              Copy English to Hindi (phir translate karo)
            </Button>
            <TextField label={form.type === 'comprehension' ? 'à¤—à¤¦à¥à¤¯à¤¾à¤‚à¤¶ (Hindi)' : 'à¤ªà¥à¤°à¤¶à¥à¤¨ (Hindi)'} multiline rows={form.type === 'comprehension' ? 5 : 2} value={form.qHi}
              onChange={(e) => setForm({ ...form, qHi: e.target.value })} fullWidth
              helperText="Khali chhoda toh English text hi dikhega (fallback)" />

            {form.type === 'mcq' && (<>
              {(['a', 'b', 'c', 'd'] as const).map((o, i) => (
                <TextField key={o} label={`à¤µà¤¿à¤•à¤²à¥à¤ª (${o})${i > 1 ? ' â€” optional' : ''}`}
                  value={form[`${o}Hi` as 'aHi']} onChange={(e) => setForm({ ...form, [`${o}Hi`]: e.target.value })} fullWidth />
              ))}
            </>)}

            {form.type === 'truefalse' && (
              <Typography variant="caption" color="text.secondary">True/False à¤µà¤¿à¤•à¤²à¥à¤ª à¤…à¤ªà¤¨à¥‡ à¤†à¤ª à¤¸à¥‡à¤Ÿ à¤¹à¥‹ à¤œà¤¾à¤¤à¥‡ à¤¹à¥ˆà¤‚ â€” Hindi text ki zaroorat nahi.</Typography>
            )}
            {form.type === 'objective' && (
              <Typography variant="caption" color="text.secondary">Objective answers (numbers/words) language-neutral hote hain â€” Hindi version optional.</Typography>
            )}
            {form.type === 'subjective' && (
              <Typography variant="caption" color="text.secondary">Subjective question ka Hindi version upar likhein.</Typography>
            )}

            <TextField label="à¤¸à¤®à¤¾à¤§à¤¾à¤¨ / Explanation (Hindi)" multiline rows={2} value={form.explHi}
              onChange={(e) => setForm({ ...form, explHi: e.target.value })} fullWidth />
          </>)}

          {form.type !== 'comprehension' && (
            <TextField label="Marks" type="number" value={form.marks} sx={{ width: 140 }}
              onChange={(e) => setForm({ ...form, marks: Number(e.target.value) })} />
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>Cancel</Button>
          <Button variant="contained" disabled={!form.question.trim() || creating} onClick={addQuestion}>
            {creating ? 'Addingâ€¦' : 'Add'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Add section dialog */}
      <Dialog open={sectionOpen} onClose={() => setSectionOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Add Section</DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          <TextField label="Section name (e.g. Section_A_MCQ)" value={sectionName} onChange={(e) => setSectionName(e.target.value)} fullWidth autoFocus />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSectionOpen(false)}>Cancel</Button>
          <Button variant="contained" disabled={!sectionName.trim()} onClick={addSection}>Create</Button>
        </DialogActions>
      </Dialog>

      {/* Bulk import dialog (docx format paste) */}
      <Dialog open={bulkOpen} onClose={() => setBulkOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>ðŸ“¥ Bulk Import â€” docx format paste karo</DialogTitle>
        <DialogContent sx={{ pt: 2, display: 'flex', flexDirection: 'column', gap: 1.5 }}>
          <Typography variant="caption" color="text.secondary">
            Format: <code>Question / Type (multiple_choice, true_false, integer, fill_ups) / Option + correct|incorrect / Answer / Solution / Marks</code> â€”
            har token apni line pe. Hindi (Devanagari) lines auto-split ho kar Hindi field mein jaati hain.
          </Typography>
          <TextField label="Questions text (paste here)" multiline rows={12} value={bulkText}
            onChange={(e) => setBulkText(e.target.value)}
            placeholder={'Question\nWhat is 2+2?\nType\nmultiple_choice\nOption\n3\nincorrect\nOption\n4\ncorrect\nSolution\nbasic addition\nMarks\n1'}
            sx={{ '& textarea': { fontFamily: 'monospace', fontSize: 13 } }} />
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button variant="outlined" disabled={!bulkText.trim() || bulkBusy} onClick={bulkParse}>
              {bulkBusy ? 'Parsingâ€¦' : 'Parse Preview'}
            </Button>
            <Button variant="contained" color="success" disabled={!bulkPreview?.length || bulkBusy} onClick={bulkImport}>
              {bulkBusy ? 'Importingâ€¦' : `Import ${bulkPreview?.length ?? 0} Questions`}
            </Button>
          </Box>
          {bulkPreview && (
            <Box sx={{ maxHeight: 300, overflow: 'auto', border: '1px solid', borderColor: 'divider', borderRadius: 1, p: 1 }}>
              <Typography variant="caption" fontWeight={800}>Preview â€” {bulkPreview.length} questions parsed:</Typography>
              {bulkPreview.map((q, i) => (
                <Box key={i} sx={{ p: 0.5, borderBottom: '1px solid', borderColor: 'divider' }}>
                  <Typography variant="caption" sx={{ display: 'block' }}>
                    <b>{i + 1}. [{q.type}{q.marks ? ` Â· ${q.marks}m` : ''}]</b> {String(q.question || '').slice(0, 80)}
                    {q.questionHi ? ' Â· à¤¹à¤¿à¤‚à¤¦à¥€ âœ“' : ''}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {q.correct ? `correct=${q.correct}` : ''}{q.acceptedAnswers ? `accepted=[${q.acceptedAnswers.join(', ')}]` : ''}
                    {q.optionA ? ` Â· opts: ${[q.optionA, q.optionB, q.optionC, q.optionD].filter(Boolean).join(' | ')}` : ''}
                    {q.explanation ? ` Â· ðŸ’¡ ${String(q.explanation).slice(0, 50)}` : ''}
                  </Typography>
                </Box>
              ))}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setBulkOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
