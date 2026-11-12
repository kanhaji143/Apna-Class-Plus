import { useEffect, useMemo, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import {
  Box, Button, Card, CardContent, Typography, Radio, RadioGroup, FormControlLabel,
  FormControl, LinearProgress, TextField, Chip, Tabs, Tab, IconButton, Tooltip,
  Rating, Dialog, DialogTitle, DialogContent, DialogActions, Select, MenuItem,
} from '@mui/material';
import CalculatorIcon from '@mui/icons-material/Calculate';
import VisibilityIcon from '@mui/icons-material/Visibility';
import FlagIcon from '@mui/icons-material/Flag';
import axios from 'axios';

/**
 * PUBLIC student-facing test player (/test/:id) — Classplus test flow:
 * sections, question palette, per-question time + speed indicators, re-attempt mode
 * (View Solution), calculator, marked-for-review, summary, rate-the-test.
 * 4 question types: mcq | truefalse | objective | subjective
 */
interface PubQuestion {
  id: number; section_id: number | null; type: string; question: string; question_hi?: string | null;
  option_a: string | null; option_b: string | null; option_c: string | null; option_d: string | null;
  option_a_hi?: string | null; option_b_hi?: string | null; option_c_hi?: string | null; option_d_hi?: string | null;
  marks: number;
}
interface Section { id: number; name: string; }
interface Review { type: string; given: string | null; correct: string | null; ok: boolean | null; marks: number; note?: string; }
interface Solution { correct: string | string[] | null; explanation: string | null; questionHi?: string | null; explanationHi?: string | null; optionsHi?: Record<string, string | null>; }

const OPTS = ['a', 'b', 'c', 'd'] as const;
const tfText = (o: string) => (o === 'a' ? 'True' : 'False');

// speed indicator (Classplus pattern): Superfast <15s, On Time <=30s, Slow >30s
const speedOf = (secs: number) => (secs <= 15 ? { label: 'Superfast', color: 'success' as const } : secs <= 30 ? { label: 'On Time', color: 'info' as const } : { label: 'Slow', color: 'warning' as const });

export default function TestTakePage() {
  const { id } = useParams();
  const [test, setTest] = useState<any>(null);
  const [sections, setSections] = useState<Section[]>([]);
  const [questions, setQuestions] = useState<PubQuestion[]>([]);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [times, setTimes] = useState<Record<number, number>>({});
  const [marked, setMarked] = useState<Set<number>>(new Set());
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [started, setStarted] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(0);
  const [idx, setIdx] = useState(0);
  const [secTab, setSecTab] = useState(0);
  const [showSummary, setShowSummary] = useState(false);
  const [calcOpen, setCalcOpen] = useState(false);
  const [solutions, setSolutions] = useState<Record<number, Solution>>({});
  const [result, setResult] = useState<{ attemptId: number; score: number; total: number; review: Record<string, Review>; pendingGrading: boolean } | null>(null);
  const [rated, setRated] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [lang, setLang] = useState<'en' | 'hi'>('en'); // English default (user choice)
  const qRef = useRef<number | null>(null);

  // bilingual text helper — lang=hi pe Hindi field, warna English (fallback English)
  const L = (en: string | null | undefined, hi: string | null | undefined): string =>
    (lang === 'hi' && hi ? hi : en) || '';

  useEffect(() => {
    axios.get(`/public/test/${id}`)
      .then((r) => { setTest(r.data.data.test); setSections(r.data.data.sections); setQuestions(r.data.data.questions); })
      .catch((e) => setError(e?.response?.data?.message || 'Test load nahi hua'));
  }, [id]);

  // countdown
  useEffect(() => {
    if (!started || result || secondsLeft <= 0) return;
    const t = setInterval(() => setSecondsLeft((s) => s - 1), 1000);
    return () => clearInterval(t);
  }, [started, result, secondsLeft]);
  const timeUp = started && !result && !!test && secondsLeft <= 0;

  // per-question time tracker (Classplus: You: 00:00)
  useEffect(() => {
    if (!started || result || showSummary) return;
    const cur = questions[idx]?.id;
    if (!cur) return;
    qRef.current = cur;
    const t = setInterval(() => {
      setTimes((prev) => ({ ...prev, [cur]: (prev[cur] || 0) + 1 }));
    }, 1000);
    return () => clearInterval(t);
  }, [started, result, showSummary, idx, questions]);

  const submit = async () => {
    if (submitting) return;
    setSubmitting(true);
    try {
      const r = await axios.post(`/public/test/${id}/submit`, { studentName: name, studentPhone: phone, answers, timeSpent: times });
      setResult(r.data.data);
      setShowSummary(false);
    } catch (e: any) {
      setError(e?.response?.data?.message || 'Submit fail hua');
      setShowSummary(false);
    } finally { setSubmitting(false); }
  };
  useEffect(() => { if (timeUp) submit(); }, [timeUp]); // eslint-disable-line

  const rate = async (stars: number) => {
    if (!result) return;
    setRated(stars);
    await axios.post(`/public/test/${id}/rate`, { attemptId: result.attemptId, stars }).catch(() => {});
  };

  const viewSolution = async (qid: number) => {
    if (solutions[qid]) { setSolutions((s) => { const n = { ...s }; delete n[qid]; return n; }); return; }
    const r = await axios.get(`/public/test/${id}/solution/${qid}`).catch(() => null);
    if (r) setSolutions((s) => ({ ...s, [qid]: r.data.data }));
  };

  const fmt = (s: number) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;

  // palette status — Classplus 4-state color coding
  // 🟩 Attempted · 🟪 Attempted+Marked · 🟧 Marked for Review · ⬜ Not attempted
  const qStatus = (q: PubQuestion) => {
    const answered = !!answers[q.id];
    const isMarked = marked.has(q.id);
    const isCurrent = questions[idx]?.id === q.id;
    const bgcolor = answered && isMarked ? '#6C5CE7' : answered ? '#00B894' : isMarked ? '#FDCB6E' : '#fff';
    const color = (answered || (isMarked && answered)) ? '#fff' : '#333';
    const border = isCurrent ? '2px solid #1976d2' : '1px solid #ccc';
    return { answered, isMarked, isCurrent, bgcolor, color, border };
  };
  const LEGEND = [
    { bg: '#00B894', label: 'Attempted' },
    { bg: '#6C5CE7', label: 'Attempted & Marked' },
    { bg: '#FDCB6E', label: 'Marked for Review' },
    { bg: '#fff', label: 'Not Attempted' },
  ];

  // section filtering
  const curSection = sections.length ? sections[secTab] : null;
  const visibleQs = curSection ? questions.filter((q) => q.section_id === curSection.id) : questions;
  const allAnswered = questions.every((q) => !!answers[q.id]);
  const answeredCount = questions.filter((q) => !!answers[q.id]).length;
  const markedCount = marked.size;

  const avgTime = useMemo(() => {
    const vals = questions.map((q) => times[q.id] || 0);
    return Math.round(vals.reduce((a, b) => a + b, 0) / Math.max(questions.length, 1));
  }, [times, questions]);

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

  // ================= RESULT VIEW =================
  if (result) {
    const pct = Math.round((result.score / Math.max(result.total, 1)) * 100);
    return (
      <Box sx={{ minHeight: '100vh', bgcolor: '#F7F8FC', p: 3 }}>
        <Box sx={{ maxWidth: 680, mx: 'auto' }}>
          <Card elevation={3}>
            <CardContent sx={{ textAlign: 'center', py: 4 }}>
              <Typography variant="h2" fontWeight={900}>{pct >= 50 ? '🎉' : '💪'}</Typography>
              <Typography variant="h4" fontWeight={900} sx={{ my: 1 }}>{result.score} / {result.total}</Typography>
              <Chip size="medium" label={`${pct}%`} color={pct >= 50 ? 'success' : 'warning'} />
              {result.pendingGrading && (
                <Typography variant="body2" color="warning.main" sx={{ mt: 1 }}>
                  📝 Subjective answers teacher grading ke baad final score update hoga
                </Typography>
              )}
              <Typography color="text.secondary" sx={{ mt: 1 }}>{test.title}</Typography>
              {/* Rate the test (Classplus pattern) */}
              <Box sx={{ mt: 2 }}>
                <Typography variant="body2" fontWeight={700}>Rate the Test</Typography>
                <Rating value={rated ?? 0} onChange={(_, v) => rate(v || 0)} size="large" />
              </Box>
            </CardContent>
          </Card>

          {/* Counters (Classplus pattern) */}
          <Box sx={{ display: 'flex', gap: 1, my: 2, flexWrap: 'wrap' }}>
            {[
              { label: 'Correct', val: questions.filter((q) => result.review[q.id]?.ok === true).length, color: 'success' },
              { label: 'Incorrect', val: questions.filter((q) => result.review[q.id]?.ok === false && result.review[q.id]?.given).length, color: 'error' },
              { label: 'Unattempted', val: questions.filter((q) => !result.review[q.id]?.given).length, color: 'default' },
              { label: 'Pending Grade', val: questions.filter((q) => result.review[q.id]?.type === 'subjective').length, color: 'warning' },
            ].map((c) => (
              <Chip key={c.label} label={`${c.val} ${c.label}`} color={c.color as any} variant="outlined" />
            ))}
          </Box>

          <Typography variant="h6" fontWeight={800} sx={{ mt: 2, mb: 1 }}>Answer Review</Typography>
          {questions.map((q, i) => {
            const rv = result.review[q.id];
            const sol = solutions[q.id];
            return (
              <Card key={q.id} elevation={1} sx={{ mb: 1 }}>
                <CardContent sx={{ py: 1.5 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Typography variant="body2" fontWeight={700} sx={{ flexGrow: 1 }}>
                      {i + 1}. {L(q.question, q.question_hi)} <Chip size="small" label={q.type} sx={{ ml: 1 }} />
                    </Typography>
                    {times[q.id] != null && (
                      <Tooltip title="Aapka time vs average">
                        <Chip size="small" variant="outlined" label={`⏱ ${fmt(times[q.id])} (${speedOf(times[q.id]).label})`} color={speedOf(times[q.id]).color} />
                      </Tooltip>
                    )}
                  </Box>
                  <Typography variant="caption" color={rv?.ok === true ? 'success.main' : rv?.ok === false ? 'error.main' : 'text.secondary'}>
                    {rv?.type === 'subjective'
                      ? `📝 Aapka jawab: "${rv.given || '—'}" · teacher grading pending`
                      : rv?.ok ? '✅ Correct' : `❌ Tumhara jawab: ${rv?.given ? (q.type === 'truefalse' ? tfText(rv.given) : rv.given) : '—'}${rv?.correct ? ` · Sahi: ${q.type === 'truefalse' ? tfText(rv.correct) : rv.correct.toUpperCase()}` : ''}`}
                  </Typography>
                  {sol && (
                    <Typography variant="caption" color="info.main" sx={{ display: 'block', mt: 0.5 }}>
                      💡 {L(sol.explanation, sol.explanationHi) || 'Koi explanation nahi'}{sol.correct ? ` · Answer: ${Array.isArray(sol.correct) ? sol.correct.join(', ') : q.type === 'truefalse' ? tfText(String(sol.correct)) : String(sol.correct).toUpperCase()}` : ''}
                    </Typography>
                  )}
                  <Button size="small" startIcon={<VisibilityIcon />} onClick={() => viewSolution(q.id)} sx={{ mt: 0.5 }}>
                    {sol ? 'Hide Solution' : 'View Solution'}
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </Box>
      </Box>
    );
  }

  // ================= START SCREEN =================
  if (!started) {
    return (
      <Box sx={{ minHeight: '100vh', display: 'grid', placeItems: 'center', bgcolor: '#F7F8FC', p: 3 }}>
        <Card elevation={3} sx={{ maxWidth: 440, width: '100%', textAlign: 'center' }}>
          <CardContent sx={{ py: 4 }}>
            <Typography variant="h3">📝</Typography>
            <Typography variant="h5" fontWeight={900} sx={{ mt: 1 }}>{test.title}</Typography>
            {test.description && <Typography color="text.secondary" sx={{ mt: 1 }}>{test.description}</Typography>}
            <Typography sx={{ mt: 2 }}>⏱ {test.duration_min} min · 📝 {questions.length} questions
              {sections.length > 0 && ` · 📑 ${sections.length} sections`}</Typography>
            {test.reattempt_mode ? <Chip size="small" label="🔄 Re-attempt mode: ON" color="info" sx={{ mt: 1 }} /> : null}
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

  const q = visibleQs[idx] || visibleQs[0];
  const gi = questions.indexOf(q);

  // ================= SUMMARY DIALOG =================
  if (showSummary) {
    return (
      <Box sx={{ minHeight: '100vh', display: 'grid', placeItems: 'center', bgcolor: '#F7F8FC', p: 3 }}>
        <Card elevation={4} sx={{ maxWidth: 520, width: '100%' }}>
          <CardContent>
            <Typography variant="h6" fontWeight={900} sx={{ mb: 2 }}>📋 Summary — Submit karein?</Typography>
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 2 }}>
              <Chip label={`✅ ${answeredCount} answered`} color="success" variant="outlined" />
              <Chip label={`⬜ ${questions.length - answeredCount} unanswered`} variant="outlined" />
              <Chip label={`🚩 ${markedCount} marked`} color="warning" variant="outlined" />
            </Box>
            {/* mini palette */}
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mb: 2 }}>
              {questions.map((pq, i) => {
                const st = qStatus(pq);
                return (
                  <Box key={pq.id} onClick={() => { setShowSummary(false); const sIdx = curSection ? visibleQs.indexOf(pq) : i; if (sIdx >= 0) setIdx(Math.max(sIdx, 0)); }}
                    sx={{ width: 34, height: 34, display: 'grid', placeItems: 'center', borderRadius: 1, cursor: 'pointer', fontWeight: 800, fontSize: 12,
                      bgcolor: st.bgcolor, color: st.color, border: st.border }}>
                    {i + 1}
                  </Box>
                );
              })}
            </Box>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.5, mb: 2 }}>
              {LEGEND.map((l) => (
                <Box key={l.label} sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <Box sx={{ width: 12, height: 12, borderRadius: 0.5, bgcolor: l.bg, border: '1px solid #ccc' }} />
                  <Typography variant="caption">{l.label}</Typography>
                </Box>
              ))}
            </Box>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>⏱ Baaki time: {fmt(Math.max(secondsLeft, 0))}</Typography>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button variant="outlined" fullWidth onClick={() => setShowSummary(false)}>Back to Test</Button>
              <Button variant="contained" color="success" fullWidth disabled={submitting} onClick={submit}>
                {submitting ? 'Submitting…' : allAnswered ? 'Final Submit' : 'Submit Anyway'}
              </Button>
            </Box>
          </CardContent>
        </Card>
      </Box>
    );
  }

  // ================= TEST TAKING =================
  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#F7F8FC', p: { xs: 1, sm: 3 } }}>
      <Box sx={{ maxWidth: 860, mx: 'auto', display: 'flex', gap: 2, alignItems: 'flex-start' }}>
        {/* Left: questions */}
        <Box sx={{ flexGrow: 1, minWidth: 0 }}>
          <Card elevation={2} sx={{ mb: 2, position: 'sticky', top: 8, zIndex: 5 }}>
            <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 1.5, py: 1.5, flexWrap: 'wrap' }}>
              <Typography fontWeight={800} sx={{ flexGrow: 1 }}>{test.title}</Typography>
              {/* View in language (Classplus pattern) — English default */}
              <FormControl size="small" sx={{ minWidth: 150 }}>
                <Select value={lang} onChange={(e) => setLang(e.target.value as 'en' | 'hi')}
                  sx={{ fontSize: 13, fontWeight: 700 }}>
                  <MenuItem value="en">🌐 View in English</MenuItem>
                  <MenuItem value="hi">🌐 हिंदी में देखें</MenuItem>
                </Select>
              </FormControl>
              {test.reattempt_mode ? <Chip size="small" label="🔄 Re-attempt: ON" color="info" /> : null}
              <Tooltip title="Calculator"><IconButton onClick={() => setCalcOpen(true)}><CalculatorIcon /></IconButton></Tooltip>
              <Chip label={`⏱ ${fmt(Math.max(secondsLeft, 0))}`} color={secondsLeft < 60 ? 'error' : 'primary'} />
            </CardContent>
            {sections.length > 0 && (
              <Tabs value={secTab} onChange={(_, v) => { setSecTab(v); setIdx(0); }} variant="scrollable" sx={{ px: 1 }}>
                {sections.map((s) => <Tab key={s.id} label={s.name} />)}
              </Tabs>
            )}
            <LinearProgress variant="determinate" value={(answeredCount / Math.max(questions.length, 1)) * 100} />
          </Card>

          {q && (
            <Card elevation={1} sx={{ mb: 1.5 }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1, flexWrap: 'wrap' }}>
                  <Typography fontWeight={800}>Question No.{gi + 1}</Typography>
                  <Chip size="small" label={q.type} variant="outlined" />
                  <Chip size="small" label={`${q.marks}m`} variant="outlined" />
                  <Chip size="small" variant="outlined" label={`⏱ You: ${fmt(times[q.id] || 0)} · Avg: ${fmt(avgTime)}`} />
                  <Box sx={{ flexGrow: 1 }} />
                  <Tooltip title={marked.has(q.id) ? 'Unmark' : 'Mark for review'}>
                    <IconButton size="small" onClick={() => setMarked((m) => { const n = new Set(m); n.has(q.id) ? n.delete(q.id) : n.add(q.id); return n; })}>
                      <FlagIcon color={marked.has(q.id) ? 'warning' : 'disabled'} />
                    </IconButton>
                  </Tooltip>
                  {/* Re-attempt mode: View Solution during test */}
                  {test.reattempt_mode ? (
                    <Button size="small" startIcon={<VisibilityIcon />} onClick={() => viewSolution(q.id)}>
                      {solutions[q.id] ? 'Hide Solution' : 'View Solution'}
                    </Button>
                  ) : null}
                </Box>
                <Typography variant="body1" fontWeight={700}>{L(q.question, q.question_hi)}</Typography>
                {solutions[q.id] && (() => {
                  const solQ = solutions[q.id];
                  const ansTxt = solQ.correct == null ? '' : Array.isArray(solQ.correct)
                    ? solQ.correct.join(', ')
                    : q.type === 'truefalse' ? tfText(String(solQ.correct)) : String(solQ.correct).toUpperCase();
                  return (
                    <Box sx={{ mt: 1, p: 1, bgcolor: 'info.lighter', borderRadius: 1 }}>
                      <Typography variant="caption" color="info.dark">
                        💡 {L(solQ.explanation, solQ.explanationHi) || 'Koi explanation nahi'}{ansTxt ? ` · Answer: ${ansTxt}` : ''}
                      </Typography>
                    </Box>
                  );
                })()}

                {/* MCQ / TrueFalse */}
                {(q.type === 'mcq' || q.type === 'truefalse') && (
                  <FormControl sx={{ mt: 1 }}>
                    <RadioGroup value={answers[q.id] || ''} onChange={(e) => setAnswers({ ...answers, [q.id]: e.target.value })}>
                      {(q.type === 'truefalse' ? ['a', 'b'] : OPTS).filter((o) => q[`option_${o}` as keyof PubQuestion]).map((o) => (
                        <FormControlLabel key={o} value={o} control={<Radio size="small" />}
                          label={`(${o}) ${q.type === 'truefalse' ? tfText(o) : L(q[`option_${o}` as keyof PubQuestion] as string, q[`option_${o}_hi` as keyof PubQuestion] as string)}`} />
                      ))}
                    </RadioGroup>
                  </FormControl>
                )}

                {/* Objective */}
                {q.type === 'objective' && (
                  <TextField fullWidth label={lang === 'hi' ? 'आपका उत्तर (लघु उत्तर)' : 'Aapka jawab (short answer)'} value={answers[q.id] || ''}
                    onChange={(e) => setAnswers({ ...answers, [q.id]: e.target.value })} sx={{ mt: 1.5 }} />
                )}

                {/* Subjective */}
                {q.type === 'subjective' && (
                  <TextField fullWidth multiline minRows={4} label={lang === 'hi' ? 'विस्तृत उत्तर लिखें (long answer)' : 'Vistrit jawab likhein (long answer)'}
                    value={answers[q.id] || ''} onChange={(e) => setAnswers({ ...answers, [q.id]: e.target.value })} sx={{ mt: 1.5 }} />
                )}
              </CardContent>
            </Card>
          )}

          <Box sx={{ display: 'flex', gap: 1, mb: 4 }}>
            <Button variant="outlined" disabled={idx <= 0} onClick={() => setIdx((i) => i - 1)}>Previous</Button>
            <Button variant="outlined" disabled={idx >= visibleQs.length - 1} onClick={() => setIdx((i) => i + 1)}>Next</Button>
            <Box sx={{ flexGrow: 1 }} />
            <Button variant="contained" color="success" onClick={() => setShowSummary(true)}>
              Summary / Submit
            </Button>
          </Box>
        </Box>

        {/* Right: question palette (Classplus pattern) */}
        <Box sx={{ display: { xs: 'none', sm: 'block' }, width: 200, position: 'sticky', top: 8 }}>
          <Card elevation={2}>
            <CardContent>
              <Typography variant="caption" fontWeight={800} color="text.secondary">QUESTIONS</Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 1 }}>
                {questions.map((pq, i) => {
                  const st = qStatus(pq);
                  return (
                    <Box key={pq.id} onClick={() => {
                      const vs = curSection ? visibleQs.indexOf(pq) : i;
                      if (vs >= 0) {
                        if (curSection && pq.section_id !== curSection.id) setSecTab(sections.findIndex((s) => s.id === pq.section_id));
                        setIdx(Math.max(vs, 0));
                      }
                    }}
                      sx={{ width: 34, height: 34, display: 'grid', placeItems: 'center', borderRadius: 1, cursor: 'pointer', fontWeight: 800, fontSize: 12,
                        bgcolor: st.bgcolor, color: st.color, border: st.border }}>
                      {i + 1}
                    </Box>
                  );
                })}
              </Box>
              {/* legend (Classplus pattern) */}
              <Box sx={{ mt: 2, display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                {LEGEND.map((l) => (
                  <Box key={l.label} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Box sx={{ width: 14, height: 14, borderRadius: 0.5, bgcolor: l.bg, border: '1px solid #ccc' }} />
                    <Typography variant="caption">{l.label}</Typography>
                  </Box>
                ))}
              </Box>
            </CardContent>
          </Card>
        </Box>
      </Box>

      {/* Calculator modal */}
      <Dialog open={calcOpen} onClose={() => setCalcOpen(false)} maxWidth="xs">
        <DialogTitle>🧮 Calculator</DialogTitle>
        <DialogContent>
          <Calculator />
        </DialogContent>
        <DialogActions><Button onClick={() => setCalcOpen(false)}>Close</Button></DialogActions>
      </Dialog>
    </Box>
  );
}

// ---------- simple on-screen calculator ----------
function Calculator() {
  const [expr, setExpr] = useState('');
  const [out, setOut] = useState('0');
  const press = (v: string) => setExpr((e) => e + v);
  const equals = () => {
    try {
      // sirf digits + operators allow (safe eval)
      if (!/^[\d+\-*/.() %]+$/.test(expr)) return;
      // eslint-disable-next-line no-new-func
      const r = Function(`"use strict"; return (${expr})`)();
      setOut(String(r));
    } catch { setOut('Error'); }
  };
  const keys = ['7', '8', '9', '/', '4', '5', '6', '*', '1', '2', '3', '-', '0', '.', '=', '+'];
  return (
    <Box sx={{ width: 240 }}>
      <TextField fullWidth value={expr} onChange={(e) => setExpr(e.target.value)} placeholder="0" sx={{ mb: 1 }} />
      <Typography variant="h5" fontWeight={800} sx={{ mb: 1, textAlign: 'right' }}>{out}</Typography>
      <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 0.5 }}>
        {keys.map((k) => (
          <Button key={k} variant="outlined" onClick={() => (k === '=' ? equals() : press(k))} sx={{ fontWeight: 800 }}>{k}</Button>
        ))}
        <Button variant="text" color="error" onClick={() => { setExpr(''); setOut('0'); }} sx={{ gridColumn: 'span 4', fontWeight: 800 }}>C (clear)</Button>
      </Box>
    </Box>
  );
}
