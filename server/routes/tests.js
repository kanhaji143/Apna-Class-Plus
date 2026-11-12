'use strict';
/**
 * Test Portal routes (Phase 10 + 11) — original Classplus CMS Content > Test Portal pattern
 * Phase 11: sections, 4 question types (mcq|truefalse|objective|subjective), explanation,
 *           re-attempt mode, per-question time, subjective grading, rate-the-test.
 * Endpoints:
 *   POST /v3/tests                      (create test; reattemptMode)
 *   GET  /v3/tests                      (list owner tests)
 *   GET  /v3/tests/:id                  (test details)
 *   PUT  /v3/tests/:id                  (update)
 *   DELETE /v3/tests/:id                (delete + questions + attempts + sections)
 *   POST /v3/tests/:id/sections         (add section)
 *   DELETE /v3/tests/:id/sections/:sid
 *   POST /v3/tests/:id/questions        (add question — type-aware)
 *   DELETE /v3/tests/:id/questions/:qid
 *   GET  /v3/tests/:id/full             (editor: test + sections + questions + attempts)
 *   POST /v3/tests/:id/publish          (draft -> published)
 *   GET  /public/test/:id               (public — published only, answers hidden)
 *   POST /public/test/:id/submit        (public — type-aware auto-score + time + attempt save)
 *   POST /public/test/:id/rate          (public — rate the test stars)
 *   GET  /v3/tests/:id/attempts         (teacher — results incl. subjective answers)
 *   POST /v3/attempts/:id/grade         (teacher — subjective grading {scores:{qid:marks}})
 */
const express = require('express');
const { db } = require('../db/init');
const { auth } = require('./auth');

const router = express.Router();
const ok = (data, message = 'successful') => ({ status: 'success', data, message });
const fail = (message) => ({ status: 'error', data: null, message });

const TYPES = ['mcq', 'truefalse', 'objective', 'subjective'];
const ownsTest = (testId, userId) =>
  db.prepare('SELECT id FROM tests WHERE id=? AND owner_id=?').get(testId, userId);

// ---------- POST /v3/tests (create) ----------
router.post('/v3/tests', auth, (req, res) => {
  const { title, courseId, description, durationMin, reattemptMode } = req.body || {};
  if (!title) return res.status(400).json(fail('title required'));
  const r = db.prepare('INSERT INTO tests (owner_id, course_id, title, description, duration_min, reattempt_mode) VALUES (?,?,?,?,?,?)')
    .run(req.user.id, courseId || null, title, description || null, durationMin || 30, reattemptMode ? 1 : 0);
  return res.json(ok(db.prepare('SELECT * FROM tests WHERE id=?').get(r.lastInsertRowid), 'Test created'));
});

// ---------- GET /v3/tests (list) ----------
router.get('/v3/tests', auth, (req, res) => {
  const tests = db.prepare(`
    SELECT t.*, c.title AS course_title,
      (SELECT COUNT(*) FROM test_questions q WHERE q.test_id=t.id) AS question_count,
      (SELECT COUNT(*) FROM test_attempts a WHERE a.test_id=t.id) AS attempt_count,
      (SELECT COUNT(*) FROM test_sections s WHERE s.test_id=t.id) AS section_count
    FROM tests t LEFT JOIN courses c ON c.id=t.course_id
    WHERE t.owner_id=? ORDER BY t.id DESC
  `).all(req.user.id);
  return res.json(ok(tests, 'Tests fetched'));
});

// ---------- GET /v3/tests/:id ----------
router.get('/v3/tests/:id', auth, (req, res) => {
  const t = db.prepare('SELECT * FROM tests WHERE id=? AND owner_id=?').get(req.params.id, req.user.id);
  if (!t) return res.status(404).json(fail('Test not found'));
  return res.json(ok(t));
});

// ---------- PUT /v3/tests/:id ----------
router.put('/v3/tests/:id', auth, (req, res) => {
  if (!ownsTest(req.params.id, req.user.id)) return res.status(404).json(fail('Test not found'));
  const { title, description, durationMin, courseId, reattemptMode } = req.body || {};
  db.prepare(`UPDATE tests SET
      title=COALESCE(?,title), description=COALESCE(?,description), duration_min=COALESCE(?,duration_min),
      course_id=COALESCE(?,course_id),
      reattempt_mode=CASE WHEN ? IS NULL THEN reattempt_mode ELSE ? END
    WHERE id=?`)
    .run(title ?? null, description ?? null, durationMin ?? null, courseId ?? null,
      reattemptMode === undefined ? null : (reattemptMode ? 1 : 0), reattemptMode === undefined ? null : (reattemptMode ? 1 : 0), req.params.id);
  return res.json(ok(db.prepare('SELECT * FROM tests WHERE id=?').get(req.params.id), 'Test updated'));
});

// ---------- DELETE /v3/tests/:id ----------
router.delete('/v3/tests/:id', auth, (req, res) => {
  if (!ownsTest(req.params.id, req.user.id)) return res.status(404).json(fail('Test not found'));
  db.prepare('DELETE FROM test_questions WHERE test_id=?').run(req.params.id);
  db.prepare('DELETE FROM test_attempts WHERE test_id=?').run(req.params.id);
  db.prepare('DELETE FROM test_sections WHERE test_id=?').run(req.params.id);
  db.prepare('DELETE FROM tests WHERE id=?').run(req.params.id);
  return res.json(ok({ deleted: true }, 'Test deleted'));
});

// ---------- POST /v3/tests/:id/sections ----------
router.post('/v3/tests/:id/sections', auth, (req, res) => {
  if (!ownsTest(req.params.id, req.user.id)) return res.status(404).json(fail('Test not found'));
  const { name } = req.body || {};
  if (!name) return res.status(400).json(fail('name required'));
  const maxOrder = db.prepare('SELECT COALESCE(MAX(sort_order),0) AS m FROM test_sections WHERE test_id=?').get(req.params.id).m;
  const r = db.prepare('INSERT INTO test_sections (test_id, name, sort_order) VALUES (?,?,?)').run(req.params.id, name, maxOrder + 1);
  return res.json(ok(db.prepare('SELECT * FROM test_sections WHERE id=?').get(r.lastInsertRowid), 'Section added'));
});

// ---------- DELETE /v3/tests/:id/sections/:sid ----------
router.delete('/v3/tests/:id/sections/:sid', auth, (req, res) => {
  if (!ownsTest(req.params.id, req.user.id)) return res.status(404).json(fail('Test not found'));
  db.prepare('UPDATE test_questions SET section_id=NULL WHERE section_id=? AND test_id=?').run(req.params.sid, req.params.id);
  db.prepare('DELETE FROM test_sections WHERE id=? AND test_id=?').run(req.params.sid, req.params.id);
  return res.json(ok({ deleted: true }, 'Section deleted'));
});

// ---------- POST /v3/tests/:id/questions (type-aware) ----------
router.post('/v3/tests/:id/questions', auth, (req, res) => {
  if (!ownsTest(req.params.id, req.user.id)) return res.status(404).json(fail('Test not found'));
  const parsed = insertQuestion(req.params.id, req.body || {});
  if (parsed.error) return res.status(400).json(fail(parsed.error));
  return res.json(ok(parsed.row, 'Question added'));
});

// ---------- POST /v3/tests/:id/import-parse (bulk paste — docx format parse preview, no insert) ----------
// Format (docx export jaisa): Question / Type / Option (+correct|incorrect) / Answer / Solution / Marks
// Token apni line pe ya "Token: value" — dono chalega. Bilingual: Devanagari line -> _hi field.
router.post('/v3/tests/:id/import-parse', auth, (req, res) => {
  if (!ownsTest(req.params.id, req.user.id)) return res.status(404).json(fail('Test not found'));
  const { text } = req.body || {};
  if (!text) return res.status(400).json(fail('text required'));
  const parsed = parseBulkText(String(text));
  return res.json(ok(parsed, `${parsed.length} questions parsed`));
});

// ---------- POST /v3/tests/:id/import (bulk insert parsed questions) ----------
router.post('/v3/tests/:id/import', auth, (req, res) => {
  if (!ownsTest(req.params.id, req.user.id)) return res.status(404).json(fail('Test not found'));
  const { questions } = req.body || {};
  if (!Array.isArray(questions) || !questions.length) return res.status(400).json(fail('questions array required'));
  const inserted = [];
  for (const q of questions) {
    const r = insertQuestion(req.params.id, q);
    if (!r.error) inserted.push(r.row.id);
  }
  return res.json(ok({ inserted: inserted.length }, 'Bulk import done'));
});

// ---------- shared: insert question (single + bulk dono use karte hain) ----------
function insertQuestion(testId, body) {
  const { question, type, optionA, optionB, optionC, optionD, correct, marks, explanation, sectionId, acceptedAnswers,
    questionHi, optionAHi, optionBHi, optionCHi, optionDHi, explanationHi } = body;
  const qType = TYPES.includes(type) ? type : 'mcq';
  if (!question) return { error: 'question required' };

  let finalOptions = { a: optionA, b: optionB, c: optionC, d: optionD };
  let finalCorrect = correct ? String(correct).toLowerCase() : '';
  let acceptedJson = null;

  if (qType === 'truefalse') {
    // True/False: options auto-set, correct = 'a' (True) | 'b' (False)
    finalOptions = { a: 'True', b: 'False' };
    if (!['a', 'b'].includes(finalCorrect)) return { error: 'truefalse ke liye correct = a (True) ya b (False)' };
  } else if (qType === 'mcq') {
    if (!finalOptions.a || !finalOptions.b) return { error: 'MCQ mein kam se kam optionA + optionB chahiye' };
    if (!['a', 'b', 'c', 'd'].includes(finalCorrect)) return { error: 'correct must be a|b|c|d' };
  } else if (qType === 'objective') {
    const list = Array.isArray(acceptedAnswers) ? acceptedAnswers.filter((x) => String(x).trim()) : (acceptedAnswers ? [String(acceptedAnswers)] : []);
    if (!list.length) return { error: 'objective ke liye acceptedAnswers (array) chahiye' };
    acceptedJson = JSON.stringify(list);
    finalOptions = { a: null, b: null, c: null, d: null };
    finalCorrect = ''; // auto-match se score hota hai
  } else { // subjective
    finalOptions = { a: null, b: null, c: null, d: null };
    finalCorrect = ''; // teacher grading
  }

  const maxOrder = db.prepare('SELECT COALESCE(MAX(sort_order),0) AS m FROM test_questions WHERE test_id=?').get(testId).m;
  const r = db.prepare(`INSERT INTO test_questions
    (test_id, section_id, type, question, option_a, option_b, option_c, option_d, correct, accepted_answers, explanation, marks, sort_order,
     question_hi, option_a_hi, option_b_hi, option_c_hi, option_d_hi, explanation_hi)
    VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`)
    .run(testId, sectionId || null, qType, question,
      finalOptions.a || null, finalOptions.b || null, finalOptions.c || null, finalOptions.d || null,
      finalCorrect, acceptedJson, explanation || null, marks || 1, maxOrder + 1,
      questionHi || null, optionAHi || null, optionBHi || null, optionCHi || null, optionDHi || null, explanationHi || null);
  return { row: db.prepare('SELECT * FROM test_questions WHERE id=?').get(r.lastInsertRowid) };
}

// ---------- bulk text parser (docx format) ----------
const hasHindi = (s) => /[\u0900-\u097F]/.test(s);
function parseBulkText(text) {
  const lines = String(text).split(/\r?\n/).map((l) => l.trim()).filter((l) => l.length);
  // tokens: apni line pe aaye ya "Token: value"
  const TOKENS = ['question', 'type', 'option', 'answer', 'solution', 'marks'];
  const items = []; // [{token, value, lang}] sequence
  for (const line of lines) {
    const m = line.match(/^([A-Za-z_]+)\s*:\s*(.*)$/);
    if (m && TOKENS.includes(m[1].toLowerCase())) {
      items.push({ token: m[1].toLowerCase(), value: m[2], inline: true });
      continue;
    }
    if (TOKENS.includes(line.toLowerCase())) { items.push({ token: line.toLowerCase(), value: '', inline: false }); continue; }
    // value line (option text / correct tag / answer content / free text)
    items.push({ token: null, value: line });
  }
  // group into questions
  const questions = [];
  let cur = null; let lastToken = null; let expecting = null; let curOption = null;
  const flush = () => { if (cur && (cur.question || (cur._qLines && cur._qLines.length))) questions.push(cur); cur = null; };
  const startQ = () => { flush(); cur = { options: [], optionTags: [], extraOptions: [] }; lastToken = null; expecting = null; curOption = null; };
  for (const it of items) {
    if (!cur && !it.token) continue; // question se pehle ka garbage skip
    if (it.token === 'question') { startQ(); cur.question = it.value || null; cur._qLines = []; if (it.value) cur._qLines.push(it.value); lastToken = 'question'; continue; }
    if (!cur) continue;
    if (it.token === 'type') { cur.type = (it.value || '').toLowerCase().trim(); lastToken = 'type'; continue; }
    if (it.token === 'option') { curOption = { text: it.value || '', hi: hasHindi(it.value || '') }; if (curOption.text) cur.options.push(curOption); lastToken = 'option'; continue; }
    if (it.token === 'answer') { cur.answer = it.value || ''; lastToken = 'answer'; continue; }
    if (it.token === 'solution') { cur.solution = it.value || null; cur._solLines = it.value ? [it.value] : []; lastToken = 'solution'; continue; }
    if (it.token === 'marks') { cur.marks = parseInt(it.value, 10) || undefined; lastToken = 'marks'; continue; }
    // token-null value lines — context ke hisaab se
    const v = it.value;
    if (lastToken === 'question') {
      cur._qLines.push(v);
    } else if (lastToken === 'type') {
      cur.type = v.toLowerCase().trim();
    } else if (lastToken === 'option') {
      if (/^(correct|incorrect)$/i.test(v)) { if (curOption) curOption.tag = v.toLowerCase(); }
      else if (curOption && !curOption.text) { curOption.text = v; curOption.hi = hasHindi(v); cur.options.push(curOption); }
      else { curOption = { text: v, hi: hasHindi(v) }; cur.options.push(curOption); }
    } else if (lastToken === 'answer') {
      cur.answer = (cur.answer ? cur.answer + ' ' : '') + v;
    } else if (lastToken === 'solution') {
      cur._solLines.push(v);
    } else if (lastToken === 'marks') {
      cur.marks = parseInt(v, 10) || cur.marks;
    }
  }
  flush();

  // map to insert bodies
  const out = [];
  for (const q of questions) {
    const type = ['multiple_choice', 'true_false', 'integer', 'fill_ups', 'mcq', 'truefalse', 'objective'].includes(q.type) ? q.type : 'multiple_choice';
    const qEnLines = (q._qLines || []).filter((l) => !hasHindi(l));
    const qHiLines = (q._qLines || []).filter((l) => hasHindi(l));
    const body = {
      type: type === 'multiple_choice' || type === 'mcq' ? 'mcq'
        : type === 'true_false' || type === 'truefalse' ? 'truefalse'
        : type === 'integer' || type === 'fill_ups' ? 'objective' : 'mcq',
      question: qEnLines.join('\n') || qHiLines.join('\n') || q.question || '',
      questionHi: qHiLines.join('\n') || undefined,
      explanation: (q._solLines || []).filter((l) => !hasHindi(l)).join('\n') || undefined,
      explanationHi: (q._solLines || []).filter((l) => hasHindi(l)).join('\n') || undefined,
      marks: q.marks || 1,
    };
    if (body.type === 'mcq') {
      const opts = (q.options || []).filter((o) => o.text);
      const letters = ['a', 'b', 'c', 'd'];
      opts.slice(0, 4).forEach((o, i) => {
        body[`option${letters[i].toUpperCase()}`] = o.hi ? undefined : o.text;
        body[`option${letters[i].toUpperCase()}Hi`] = o.hi ? o.text : undefined;
      });
      const ci = opts.findIndex((o) => o.tag === 'correct');
      body.correct = ci >= 0 ? letters[Math.min(ci, 3)] : 'a';
    } else if (body.type === 'truefalse') {
      body.correct = /^f/i.test(String(q.answer || '').trim()) ? 'b' : 'a';
    } else { // objective
      // answer ya pehla option (comma separated), range() wala ignore
      let raw = String(q.answer || '').trim();
      if (!raw && (q.options || []).length) raw = q.options[0].text;
      const list = raw.split(',').map((s) => s.trim()).filter((s) => s && !/^range\(/i.test(s));
      body.acceptedAnswers = list.length ? list : [raw];
    }
    out.push(body);
  }
  return out;
}

// ---------- DELETE /v3/tests/:id/questions/:qid ----------
router.delete('/v3/tests/:id/questions/:qid', auth, (req, res) => {
  if (!ownsTest(req.params.id, req.user.id)) return res.status(404).json(fail('Test not found'));
  db.prepare('DELETE FROM test_questions WHERE id=? AND test_id=?').run(req.params.qid, req.params.id);
  return res.json(ok({ deleted: true }, 'Question deleted'));
});

// ---------- GET /v3/tests/:id/full (editor) ----------
router.get('/v3/tests/:id/full', auth, (req, res) => {
  const t = db.prepare('SELECT * FROM tests WHERE id=? AND owner_id=?').get(req.params.id, req.user.id);
  if (!t) return res.status(404).json(fail('Test not found'));
  const sections = db.prepare('SELECT * FROM test_sections WHERE test_id=? ORDER BY sort_order, id').all(req.params.id);
  const questions = db.prepare('SELECT * FROM test_questions WHERE test_id=? ORDER BY sort_order, id').all(req.params.id);
  const attempts = db.prepare('SELECT * FROM test_attempts WHERE test_id=? ORDER BY id DESC LIMIT 100').all(req.params.id);
  // attempts ke answers parse karke bhejo (grading UI ke liye)
  const attemptsParsed = attempts.map((a) => ({
    ...a,
    answers: JSON.parse(a.answers_json || '{}'),
    time: JSON.parse(a.time_json || '{}'),
    manual: JSON.parse(a.manual_json || '{}'),
  }));
  return res.json(ok({ test: t, sections, questions, attempts: attemptsParsed }, 'Test detail fetched'));
});

// ---------- POST /v3/tests/:id/publish ----------
router.post('/v3/tests/:id/publish', auth, (req, res) => {
  const t = db.prepare('SELECT * FROM tests WHERE id=? AND owner_id=?').get(req.params.id, req.user.id);
  if (!t) return res.status(404).json(fail('Test not found'));
  const qCount = db.prepare('SELECT COUNT(*) AS c FROM test_questions WHERE test_id=?').get(req.params.id).c;
  if (qCount === 0) return res.status(400).json(fail('Publish se pehle kam se kam 1 question add karo'));
  db.prepare("UPDATE tests SET status='published' WHERE id=?").run(req.params.id);
  return res.json(ok(db.prepare('SELECT * FROM tests WHERE id=?').get(req.params.id), 'Test published'));
});

// ---------- GET /public/test/:id (student-facing, answers hidden) ----------
router.get('/public/test/:id', (req, res) => {
  const t = db.prepare('SELECT id, title, description, duration_min, status, reattempt_mode FROM tests WHERE id=?').get(req.params.id);
  if (!t || t.status !== 'published') return res.status(404).json(fail('Test not available'));
  const sections = db.prepare('SELECT * FROM test_sections WHERE test_id=? ORDER BY sort_order, id').all(req.params.id);
  const questions = db.prepare(`
    SELECT id, section_id, type, question, option_a, option_b, option_c, option_d, marks,
           question_hi, option_a_hi, option_b_hi, option_c_hi, option_d_hi, explanation_hi
    FROM test_questions WHERE test_id=? ORDER BY sort_order, id
  `).all(req.params.id); // correct/accepted/explanation intentionally NOT sent
  return res.json(ok({ test: t, sections, questions }, 'Test fetched'));
});

// ---------- POST /public/test/:id/submit (type-aware auto-score) ----------
router.post('/public/test/:id/submit', (req, res) => {
  const t = db.prepare('SELECT * FROM tests WHERE id=?').get(req.params.id);
  if (!t || t.status !== 'published') return res.status(404).json(fail('Test not available'));
  const { studentName, studentPhone, answers, timeSpent } = req.body || {};
  if (!answers || typeof answers !== 'object') return res.status(400).json(fail('answers required'));

  const questions = db.prepare('SELECT * FROM test_questions WHERE test_id=?').all(req.params.id);
  let autoScore = 0, total = 0, hasSubjective = false;
  const review = {};
  for (const q of questions) {
    total += q.marks;
    const given = answers[q.id] !== undefined ? String(answers[q.id]) : '';
    if (q.type === 'subjective') {
      hasSubjective = true;
      review[q.id] = { type: 'subjective', given: given || null, ok: null, marks: q.marks, note: 'Teacher grading pending' };
      continue;
    }
    let isRight = false;
    if (q.type === 'objective') {
      const list = JSON.parse(q.accepted_answers || '[]').map((x) => String(x).trim().toLowerCase());
      isRight = list.includes(given.trim().toLowerCase());
    } else { // mcq | truefalse
      isRight = given.toLowerCase() === q.correct;
    }
    review[q.id] = { type: q.type, given: given || null, correct: q.correct || null, ok: isRight, marks: q.marks };
    if (isRight) autoScore += q.marks;
  }

  const timeJson = timeSpent && typeof timeSpent === 'object' ? JSON.stringify(timeSpent) : null;
  const r = db.prepare(`INSERT INTO test_attempts
    (test_id, student_name, student_phone, answers_json, time_json, manual_json, graded, score, total)
    VALUES (?,?,?,?,?,?,?,?,?)`)
    .run(req.params.id, studentName || null, studentPhone || null, JSON.stringify(answers),
      timeJson, JSON.stringify({}), hasSubjective ? 0 : 1, autoScore, total);
  const attemptId = r.lastInsertRowid;

  return res.json(ok({
    attemptId, score: autoScore, total, review,
    pendingGrading: hasSubjective, // subjective answers teacher grade karega
  }, 'Test submitted'));
});

// ---------- GET /public/test/:id/solution/:qid (View Solution — re-attempt mode / review) ----------
router.get('/public/test/:id/solution/:qid', (req, res) => {
  const t = db.prepare("SELECT id FROM tests WHERE id=? AND status='published'").get(req.params.id);
  if (!t) return res.status(404).json(fail('Test not available'));
  const q = db.prepare('SELECT type, question, option_a, option_b, option_c, option_d, correct, accepted_answers, explanation, question_hi, option_a_hi, option_b_hi, option_c_hi, option_d_hi, explanation_hi FROM test_questions WHERE id=? AND test_id=?')
    .get(req.params.qid, req.params.id);
  if (!q) return res.status(404).json(fail('Question not found'));
  return res.json(ok({
    type: q.type, question: q.question,
    options: { a: q.option_a, b: q.option_b, c: q.option_c, d: q.option_d },
    optionsHi: { a: q.option_a_hi, b: q.option_b_hi, c: q.option_c_hi, d: q.option_d_hi },
    questionHi: q.question_hi || null, explanationHi: q.explanation_hi || null,
    correct: q.type === 'objective' ? JSON.parse(q.accepted_answers || '[]') : q.correct || null,
    explanation: q.explanation || null,
  }, 'Solution fetched'));
});

// ---------- POST /public/test/:id/rate (rate the test) ----------
router.post('/public/test/:id/rate', (req, res) => {
  const { attemptId, stars } = req.body || {};
  const s = Math.max(1, Math.min(5, Number(stars) || 0));
  const a = db.prepare('SELECT id FROM test_attempts WHERE id=? AND test_id=?').get(attemptId, req.params.id);
  if (!a) return res.status(404).json(fail('Attempt not found'));
  db.prepare('UPDATE test_attempts SET rated=? WHERE id=?').run(s, attemptId);
  return res.json(ok({ rated: s }, 'Thanks for rating!'));
});

// ---------- GET /v3/tests/:id/attempts (teacher — results) ----------
router.get('/v3/tests/:id/attempts', auth, (req, res) => {
  if (!ownsTest(req.params.id, req.user.id)) return res.status(404).json(fail('Test not found'));
  const attempts = db.prepare('SELECT * FROM test_attempts WHERE test_id=? ORDER BY id DESC').all(req.params.id)
    .map((a) => ({ ...a, answers: JSON.parse(a.answers_json || '{}'), manual: JSON.parse(a.manual_json || '{}') }));
  const questions = db.prepare('SELECT * FROM test_questions WHERE test_id=? ORDER BY sort_order, id').all(req.params.id);
  return res.json(ok({ attempts, questions }, 'Attempts fetched'));
});

// ---------- POST /v3/attempts/:id/grade (teacher — subjective grading) ----------
router.post('/v3/attempts/:id/grade', auth, (req, res) => {
  const { scores } = req.body || {};
  if (!scores || typeof scores !== 'object') return res.status(400).json(fail('scores required'));
  const a = db.prepare(`
    SELECT a.* FROM test_attempts a JOIN tests t ON t.id=a.test_id
    WHERE a.id=? AND t.owner_id=?
  `).get(req.params.id, req.user.id);
  if (!a) return res.status(404).json(fail('Attempt not found'));

  const questions = db.prepare('SELECT * FROM test_questions WHERE test_id=?').all(a.test_id);
  let autoScore = 0, total = 0;
  const manual = {};
  for (const q of questions) {
    total += q.marks;
    const given = JSON.parse(a.answers_json || '{}')[q.id];
    if (q.type === 'subjective') {
      const m = Math.max(0, Math.min(q.marks, Number(scores[q.id]) || 0));
      manual[q.id] = m;
    } else if (q.type === 'objective') {
      const list = JSON.parse(q.accepted_answers || '[]').map((x) => String(x).trim().toLowerCase());
      if (list.includes(String(given ?? '').trim().toLowerCase())) autoScore += q.marks;
    } else if (String(given ?? '').toLowerCase() === q.correct) {
      autoScore += q.marks;
    }
  }
  const finalScore = autoScore + Object.values(manual).reduce((s, m) => s + m, 0);
  db.prepare('UPDATE test_attempts SET manual_json=?, graded=1, score=? WHERE id=?')
    .run(JSON.stringify(manual), finalScore, a.id);
  return res.json(ok({ score: finalScore, total, manual }, 'Attempt graded'));
});

module.exports = { router };
