'use strict';
/**
 * Batches & People routes (Phase 6)
 * Endpoints: /v2/batches, /v2/batch/students, /v2/people (leads + students)
 */
const express = require('express');
const { db } = require('../db/init');
const { auth } = require('./auth');

const router = express.Router();
const ok = (data, message = 'successful') => ({ status: 'success', data, message });
const fail = (message) => ({ status: 'error', data: null, message });

// ---------- POST /v2/batches (create) ----------
router.post('/v2/batches', auth, (req, res) => {
  const { courseId, name, startDate, endDate } = req.body || {};
  if (!courseId || !name) return res.status(400).json(fail('courseId, name required'));
  const c = db.prepare('SELECT id FROM courses WHERE id=? AND owner_id=?').get(courseId, req.user.id);
  if (!c) return res.status(404).json(fail('Course not found'));
  const r = db.prepare('INSERT INTO batches (course_id, owner_id, name, start_date, end_date) VALUES (?,?,?,?,?)')
    .run(courseId, req.user.id, name, startDate || null, endDate || null);
  return res.json(ok(db.prepare('SELECT * FROM batches WHERE id=?').get(r.lastInsertRowid), 'Batch created'));
});

// ---------- GET /v2/batches (list by course or all) ----------
router.get('/v2/batches', auth, (req, res) => {
  const courseId = req.query.courseId;
  let rows;
  if (courseId) {
    rows = db.prepare('SELECT b.*, c.title AS courseTitle FROM batches b JOIN courses c ON c.id=b.course_id WHERE b.course_id=? AND b.owner_id=? ORDER BY b.id DESC').all(courseId, req.user.id);
  } else {
    rows = db.prepare('SELECT b.*, c.title AS courseTitle FROM batches b JOIN courses c ON c.id=b.course_id WHERE b.owner_id=? ORDER BY b.id DESC').all(req.user.id);
  }
  // add student count
  const withCount = rows.map((b) => ({
    ...b,
    studentCount: db.prepare('SELECT COUNT(*) AS c FROM batch_students WHERE batch_id=?').get(b.id).c,
  }));
  return res.json(ok(withCount, 'Batches fetched'));
});

// ---------- GET /v2/batches/:id ----------
router.get('/v2/batches/:id', auth, (req, res) => {
  const b = db.prepare('SELECT b.*, c.title AS courseTitle FROM batches b JOIN courses c ON c.id=b.course_id WHERE b.id=? AND b.owner_id=?').get(req.params.id, req.user.id);
  if (!b) return res.status(404).json(fail('Batch not found'));
  const students = db.prepare(
    `SELECT u.id, u.name, u.phone, u.role, bs.enrolled_at
     FROM batch_students bs JOIN users u ON u.id=bs.student_id
     WHERE bs.batch_id=? ORDER BY bs.enrolled_at DESC`
  ).all(req.params.id);
  return res.json(ok({ ...b, students }, 'Batch fetched'));
});

// ---------- PUT /v2/batches/:id ----------
router.put('/v2/batches/:id', auth, (req, res) => {
  const { name, startDate, endDate, status } = req.body || {};
  const b = db.prepare('SELECT id FROM batches WHERE id=? AND owner_id=?').get(req.params.id, req.user.id);
  if (!b) return res.status(404).json(fail('Batch not found'));
  db.prepare('UPDATE batches SET name=COALESCE(?,name), start_date=COALESCE(?,start_date), end_date=COALESCE(?,end_date), status=COALESCE(?,status) WHERE id=?')
    .run(name, startDate, endDate, status, req.params.id);
  return res.json(ok(db.prepare('SELECT * FROM batches WHERE id=?').get(req.params.id), 'Batch updated'));
});

// ---------- DELETE /v2/batches/:id (archive) ----------
router.delete('/v2/batches/:id', auth, (req, res) => {
  db.prepare("UPDATE batches SET status='archived' WHERE id=? AND owner_id=?").run(req.params.id, req.user.id);
  return res.json(ok({ archived: true }, 'Batch archived'));
});

// ---------- POST /v2/batch/students/add ----------
router.post('/v2/batch/students/add', auth, (req, res) => {
  const { batchId, studentId, phone, name } = req.body || {};
  if (!batchId) return res.status(400).json(fail('batchId required'));
  const b = db.prepare('SELECT id FROM batches WHERE id=? AND owner_id=?').get(batchId, req.user.id);
  if (!b) return res.status(404).json(fail('Batch not found'));

  let sid = studentId;
  if (!sid && phone) {
    let u = db.prepare('SELECT id FROM users WHERE phone=?').get(phone);
    if (!u) {
      const r = db.prepare('INSERT INTO users (name, phone, role) VALUES (?,?,?)').run(name || 'Student', phone, 'student');
      u = { id: r.lastInsertRowid };
    }
    sid = u.id;
  }
  if (!sid) return res.status(400).json(fail('studentId or phone required'));

  try {
    db.prepare('INSERT INTO batch_students (batch_id, student_id) VALUES (?,?)').run(batchId, sid);
  } catch (e) {
    return res.status(400).json(fail('Student already in batch'));
  }
  return res.json(ok({ batchId, studentId: sid }, 'Student added to batch'));
});

// ---------- DELETE /v2/batch/students/remove ----------
router.delete('/v2/batch/students/remove', auth, (req, res) => {
  const { batchId, studentId } = req.body || req.query || {};
  if (!batchId || !studentId) return res.status(400).json(fail('batchId, studentId required'));
  const b = db.prepare('SELECT id FROM batches WHERE id=? AND owner_id=?').get(batchId, req.user.id);
  if (!b) return res.status(404).json(fail('Batch not found'));
  db.prepare('DELETE FROM batch_students WHERE batch_id=? AND student_id=?').run(batchId, studentId);
  return res.json(ok({ removed: true }, 'Student removed from batch'));
});

// ---------- GET /v2/people (leads + students combined) ----------
router.get('/v2/people', auth, (req, res) => {
  const leads = db.prepare(
    `SELECT l.id, l.name, l.phone, l.created_at, p.title AS source, 'lead' AS type
     FROM leads l JOIN landing_pages p ON p.id = l.page_id
     WHERE p.owner_id = ? ORDER BY l.id DESC LIMIT 200`
  ).all(req.user.id);
  const students = db.prepare(
    `SELECT id, name, phone, created_at, 'student' AS type, NULL AS source FROM users WHERE role='student' ORDER BY id DESC LIMIT 200`
  ).all();
  return res.json(ok({ leads, students, total: leads.length + students.length }, 'People fetched'));
});

module.exports = { router };