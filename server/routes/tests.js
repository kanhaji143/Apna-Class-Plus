'use strict';
/**
 * Test Portal routes (Phase 10) — original Classplus CMS Content > Test Portal pattern
 * Endpoints:
 *   POST /v3/tests                (create test)
 *   GET  /v3/tests                (list owner tests)
 *   GET  /v3/tests/:id            (test details)
 *   PUT  /v3/tests/:id            (update)
 *   DELETE /v3/tests/:id          (delete + questions + attempts)
 *   POST /v3/tests/:id/questions  (add MCQ question)
 *   DELETE /v3/tests/:id/questions/:qid
 *   GET  /v3/tests/:id/full       (test + questions — editor)
 *   POST /v3/tests/:id/publish    (draft -> published)
 *   GET  /public/test/:id         (public — published only, answers hidden)
 *   POST /public/test/:id/submit  (public — auto-score + attempt save)
 */
const express = require('express');
const { db } = require('../db/init');
const { auth } = require('./auth');

const router = express.Router();
const ok = (data, message = 'successful') => ({ status: 'success', data, message });
const fail = (message) => ({ status: 'error', data: null, message });

const ownsTest = (testId, userId) =>
  db.prepare('SELECT id FROM tests WHERE id=? AND owner_id=?').get(testId, userId);

// ---------- POST /v3/tests (create) ----------
router.post('/v3/tests', auth, (req, res) => {
  const { title, courseId, description, durationMin } = req.body || {};
  if (!title) return res.status(400).json(fail('title required'));
  const r = db.prepare('INSERT INTO tests (owner_id, course_id, title, description, duration_min) VALUES (?,?,?,?,?)')
    .run(req.user.id, courseId || null, title, description || null, durationMin || 30);
  return res.json(ok(db.prepare('SELECT * FROM tests WHERE id=?').get(r.lastInsertRowid), 'Test created'));
});

// ---------- GET /v3/tests (list) ----------
router.get('/v3/tests', auth, (req, res) => {
  const tests = db.prepare(`
    SELECT t.*, c.title AS course_title,
      (SELECT COUNT(*) FROM test_questions q WHERE q.test_id=t.id) AS question_count,
      (SELECT COUNT(*) FROM test_attempts a WHERE a.test_id=t.id) AS attempt_count
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
  const { title, description, durationMin, courseId } = req.body || {};
  db.prepare('UPDATE tests SET title=COALESCE(?,title), description=COALESCE(?,description), duration_min=COALESCE(?,duration_min), course_id=COALESCE(?,course_id) WHERE id=?')
    .run(title ?? null, description ?? null, durationMin ?? null, courseId ?? null, req.params.id);
  return res.json(ok(db.prepare('SELECT * FROM tests WHERE id=?').get(req.params.id), 'Test updated'));
});

// ---------- DELETE /v3/tests/:id ----------
router.delete('/v3/tests/:id', auth, (req, res) => {
  if (!ownsTest(req.params.id, req.user.id)) return res.status(404).json(fail('Test not found'));
  db.prepare('DELETE FROM test_questions WHERE test_id=?').run(req.params.id);
  db.prepare('DELETE FROM test_attempts WHERE test_id=?').run(req.params.id);
  db.prepare('DELETE FROM tests WHERE id=?').run(req.params.id);
  return res.json(ok({ deleted: true }, 'Test deleted'));
});

// ---------- POST /v3/tests/:id/questions (add MCQ) ----------
router.post('/v3/tests/:id/questions', auth, (req, res) => {
  if (!ownsTest(req.params.id, req.user.id)) return res.status(404).json(fail('Test not found'));
  const { question, optionA, optionB, optionC, optionD, correct, marks } = req.body || {};
  if (!question || !correct) return res.status(400).json(fail('question + correct required'));
  if (!['a', 'b', 'c', 'd'].includes(String(correct).toLowerCase())) return res.status(400).json(fail('correct must be a|b|c|d'));
  const maxOrder = db.prepare('SELECT COALESCE(MAX(sort_order),0) AS m FROM test_questions WHERE test_id=?').get(req.params.id).m;
  const r = db.prepare('INSERT INTO test_questions (test_id, question, option_a, option_b, option_c, option_d, correct, marks, sort_order) VALUES (?,?,?,?,?,?,?,?,?)')
    .run(req.params.id, question, optionA || null, optionB || null, optionC || null, optionD || null,
      String(correct).toLowerCase(), marks || 1, maxOrder + 1);
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
  const questions = db.prepare('SELECT * FROM test_questions WHERE test_id=? ORDER BY sort_order, id').all(req.params.id);
  const attempts = db.prepare('SELECT * FROM test_attempts WHERE test_id=? ORDER BY id DESC LIMIT 50').all(req.params.id);
  return res.json(ok({ test: t, questions, attempts }, 'Test detail fetched'));
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
  const t = db.prepare("SELECT id, title, description, duration_min, status FROM tests WHERE id=?").get(req.params.id);
  if (!t || t.status !== 'published') return res.status(404).json(fail('Test not available'));
  const questions = db.prepare(`
    SELECT id, question, option_a, option_b, option_c, option_d, marks
    FROM test_questions WHERE test_id=? ORDER BY sort_order, id
  `).all(req.params.id); // correct answers intentionally NOT sent
  return res.json(ok({ test: t, questions }, 'Test fetched'));
});

// ---------- POST /public/test/:id/submit (auto-score) ----------
router.post('/public/test/:id/submit', (req, res) => {
  const t = db.prepare("SELECT * FROM tests WHERE id=?").get(req.params.id);
  if (!t || t.status !== 'published') return res.status(404).json(fail('Test not available'));
  const { studentName, studentPhone, answers } = req.body || {};
  if (!answers || typeof answers !== 'object') return res.status(400).json(fail('answers required'));
  const questions = db.prepare('SELECT id, correct, marks FROM test_questions WHERE test_id=?').all(req.params.id);
  let score = 0, total = 0;
  const review = {};
  for (const q of questions) {
    total += q.marks;
    const given = String(answers[q.id] || '').toLowerCase();
    review[q.id] = { given: given || null, correct: q.correct, marks: q.marks, ok: given === q.correct };
    if (given === q.correct) score += q.marks;
  }
  db.prepare('INSERT INTO test_attempts (test_id, student_name, student_phone, answers_json, score, total) VALUES (?,?,?,?,?,?)')
    .run(req.params.id, studentName || null, studentPhone || null, JSON.stringify(answers), score, total);
  return res.json(ok({ score, total, review }, 'Test submitted'));
});

// ---------- GET /v3/tests/:id/attempts (teacher — results) ----------
router.get('/v3/tests/:id/attempts', auth, (req, res) => {
  if (!ownsTest(req.params.id, req.user.id)) return res.status(404).json(fail('Test not found'));
  const attempts = db.prepare('SELECT * FROM test_attempts WHERE test_id=? ORDER BY id DESC').all(req.params.id);
  return res.json(ok(attempts, 'Attempts fetched'));
});

module.exports = { router };
