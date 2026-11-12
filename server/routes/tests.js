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
  const { question, type, optionA, optionB, optionC, optionD, correct, marks, explanation, sectionId, acceptedAnswers } = req.body || {};
  const qType = TYPES.includes(type) ? type : 'mcq';
  if (!question) return res.status(400).json(fail('question required'));

  let finalOptions = { a: optionA, b: optionB, c: optionC, d: optionD };
  let finalCorrect = correct ? String(correct).toLowerCase() : '';
  let acceptedJson = null;

  if (qType === 'truefalse') {
    // True/False: options auto-set, correct = 'a' (True) | 'b' (False)
    finalOptions = { a: 'True', b: 'False', c: null, d: null };
    if (!['a', 'b'].includes(finalCorrect)) return res.status(400).json(fail('truefalse ke liye correct = a (True) ya b (False)'));
  } else if (qType === 'mcq') {
    if (!finalOptions.a || !finalOptions.b) return res.status(400).json(fail('MCQ mein kam se kam optionA + optionB chahiye'));
    if (!['a', 'b', 'c', 'd'].includes(finalCorrect)) return res.status(400).json(fail('correct must be a|b|c|d'));
  } else if (qType === 'objective') {
    const list = Array.isArray(acceptedAnswers) ? acceptedAnswers.filter((x) => String(x).trim()) : (acceptedAnswers ? [String(acceptedAnswers)] : []);
    if (!list.length) return res.status(400).json(fail('objective ke liye acceptedAnswers (array) chahiye'));
    acceptedJson = JSON.stringify(list);
    finalOptions = { a: null, b: null, c: null, d: null };
    finalCorrect = ''; // auto-match se score hota hai
  } else { // subjective
    finalOptions = { a: null, b: null, c: null, d: null };
    finalCorrect = ''; // teacher grading
  }

  const maxOrder = db.prepare('SELECT COALESCE(MAX(sort_order),0) AS m FROM test_questions WHERE test_id=?').get(req.params.id).m;
  const r = db.prepare(`INSERT INTO test_questions
    (test_id, section_id, type, question, option_a, option_b, option_c, option_d, correct, accepted_answers, explanation, marks, sort_order)
    VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)`)
    .run(req.params.id, sectionId || null, qType, question,
      finalOptions.a || null, finalOptions.b || null, finalOptions.c || null, finalOptions.d || null,
      finalCorrect, acceptedJson, explanation || null, marks || 1, maxOrder + 1);
  return res.json(ok(db.prepare('SELECT * FROM test_questions WHERE id=?').get(r.lastInsertRowid), 'Question added'));
});

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
    SELECT id, section_id, type, question, option_a, option_b, option_c, option_d, marks
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
  const q = db.prepare('SELECT type, question, option_a, option_b, option_c, option_d, correct, accepted_answers, explanation FROM test_questions WHERE id=? AND test_id=?')
    .get(req.params.qid, req.params.id);
  if (!q) return res.status(404).json(fail('Question not found'));
  return res.json(ok({
    type: q.type, question: q.question,
    options: { a: q.option_a, b: q.option_b, c: q.option_c, d: q.option_d },
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
